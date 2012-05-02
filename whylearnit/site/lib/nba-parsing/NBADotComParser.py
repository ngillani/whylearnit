#! /usr/bin/python
#
# Author: Stephen Poletto (spoletto), Nabeel Gillani (ngillani)
# Spring 2011
# This script uses Beautiful Soup to scrape player statistics data from
# NBA.com. The functionality of this parser is dependent upon the markup
# of http://www.nba.com/playerfile/<playername>/index.html (and of course
# the existence of that page, which may change with redesigns to NBA.com)

from django.utils.synch import RWLock
from BeautifulSoup import BeautifulSoup
import time
import urllib2, collections
import string
from SpellChecker import SpellChecker

# spoletto: 3-25-2011
# There are all sorts of opportunities for caching in this file.
# When possible, we want to avoid going to NBA.com or WBNA.com,
# since these will require a round-trip to the NBA servers plus
# parsing time. For now, we're just using in-memory Python
# dictionaries. Since the data sets we're caching are relatively
# small, I don't think it's worth using memcached, file or DB
# caches. Further, Django's built-in caching structure isn't
# as extensible as we need it to be. It has a TIMEOUT parameter,
# but we only want to TIMEOUT if NBA.com still has the same
# DOM structure. If NBA.com changes, we want to use stale data
# from the cache until someone can patch the parser. Since Django's
# built in memory cache doesn't seem to support this type of
# functionality, I'm doing it myself. The memory footprint shouldn't
# be bad, again because of the limited dataset size.

# There are currently three layers of caching - player stats, 
# player career stats and NBA player listings.

# ! Important: These need to utilize locks in order to be thread-safe.
SEARCH_NAME_TO_RESULTS_TIMEOUT = 60 * 60 * 24 # 24 hour timeout
searchNameToResults = {}
searchNameToResultsLock = RWLock()
searchNameToPurgeTime = {}

SEARCH_NAME_TO_CAREER_RESULTS_TIMEOUT = 60 * 60 * 24 # 24 hour timeout
searchNameToCareerResults = {}
searchNameToCareerResultsLock = RWLock()
searchNameToCareerPurgeTime = {}

LEAGUE_TO_PLAYER_LISTINGS_TIMEOUT = 60 * 60 * 24 # 24 hour timeout
leagueToPlayerListings = {}
leagueToPlayerListingsLock = RWLock()
leagueToPlayerListingsPurgeTime = {}

# For now, just using a hard coded source. Eventually, we'll want
# to write a callback function that takes in a player's name and
# generates the relevent URL, trying both NBA.com and WBNA.com.


# Build dictionary of team code to team name so we can associate players with their appropriate team
teamCodeToName = {}

teamCodeToName['ATL'] = 'Atlanta Hawks'
teamCodeToName['BOS'] = 'Boston Celtics'
teamCodeToName['CHA'] = 'Charlotte Bobcats'
teamCodeToName['CHI'] = 'Chicago Bulls'
teamCodeToName['CLE'] = 'Cleveland Cavaliers'
teamCodeToName['DAL'] = 'Dallas Mavericks'
teamCodeToName['DEN'] = 'Denver Nuggets'
teamCodeToName['DET'] = 'Detroit Pistons'
teamCodeToName['GSW'] = 'Golden State Warriors'
teamCodeToName['HOU'] = 'Houston Rockets'
teamCodeToName['IND'] = 'Indiana Pacers'
teamCodeToName['LAC'] = 'LA Clippers'
teamCodeToName['LAL'] = 'LA Lakers'
teamCodeToName['MEM'] = 'Memphis Grizzlies'
teamCodeToName['MIA'] = 'Miami Heat'
teamCodeToName['MIL'] = 'Milwaukee Bucks'
teamCodeToName['MIN'] = 'Minnesota Timberwolves'
teamCodeToName['NJN'] = 'New Jersey Nets'
teamCodeToName['NOH'] = 'New Orleans Hornets'
teamCodeToName['NYK'] = 'New York Knicks'
teamCodeToName['OKC'] = 'Oklahoma City Thunder'
teamCodeToName['ORL'] = 'Orlando Magic'
teamCodeToName['PHI'] = 'Philadelphia 76ers'
teamCodeToName['PHX'] = 'Phoenix Suns'
teamCodeToName['POR'] = 'Portland Trailblazers'
teamCodeToName['SAC'] = 'Sacramento Kings'
teamCodeToName['SAS'] = 'San Antonio Spurs'
teamCodeToName['TOR'] = 'Toronto Raptors'
teamCodeToName['UTA'] = 'Utah Jazz'
teamCodeToName['WAS'] = 'Washington Wizards'

# Default, for All-Star and Career Fields
teamCodeToName['--'] = 'N/A'

# Do the same for the WNBA
teamCodeToNameWNBA = {}

teamCodeToNameWNBA['ATL'] = 'Atlanta Dream'
teamCodeToNameWNBA['MIN'] = 'Minnesota Lynx'
teamCodeToNameWNBA['TUL'] = 'Tulsa Shock'
teamCodeToNameWNBA['CHI'] = 'Chicago Sky'
teamCodeToNameWNBA['NYL'] = 'New York Liberty'
teamCodeToNameWNBA['WAS'] = 'Washington Mystics'
teamCodeToNameWNBA['CON'] = 'Connecticut Sun'
teamCodeToNameWNBA['PHO'] = 'Phoenix Mercury'
teamCodeToNameWNBA['IND'] = 'Indiana Fever'
teamCodeToNameWNBA['SAN'] = 'San Antonio Silver Stars'
teamCodeToNameWNBA['LAS'] = 'LA Sparks'
teamCodeToNameWNBA['SEA'] = 'Seattle Storm'

# Default, for All-Star and Career Fields
teamCodeToName['--'] = 'N/A'

# Error Message Dictionary
errorMessages = {}
errorMessages["NONE"] = 'No error.'
errorMessages["STAT_PARSING_ERROR"] = 'An error occurred while trying to gather the player\'s statistics.  Please try again.'
errorMessages["SERVER_CONNECT_ERROR"] = 'Could not connect to the NBA / WNBA server.  Please try again.'
errorMessages["NOT_IN_LEAGUE"] = 'An error occurred while trying to gather the player\'s statistics.  The player may no longer be in the NBA or WNBA.  Please try searching for a different player.'

# League constants
NBA_LEAGUE = 'nba'
WNBA_LEAGUE = 'wnba'

class PlayerStats:
	
	def rebuildCache(self):
		for league in [NBA_LEAGUE, WNBA_LEAGUE]:
			firstnames, lastnames, fullnames, playerURLNames = self.getPlayerListings(league)
			for playername in fullnames:
				playerURLName = playerURLNames[playername.lower()]
				playerInfo = self.fetchCurrPlayerInfoFromSpecifiedServer(playername, playerURLName, league)
				if playerInfo[0] == None:
					print 'There was an error processing ' + playername + '\'s current stats.'
				careerStats = self.fetchCareerPlayerInfoFromSpecifiedServer(playername, playerURLName, league)
				if careerStats[0] == '':
					print 'There was an error processing ' + playername + '\'s career stats.'
	
	'''Gives the appropriate team-to-code-name dictionary based on the league specified'''
	def getCodeToTeamDictionary(self, league=NBA_LEAGUE):
		if (league == NBA_LEAGUE):
			return teamCodeToName
		else:
			return teamCodeToNameWNBA
		
	'''Remove any non-url safe chars from playerFirstName and playerLastName'''
	def cleanPlayerName(self, playerFirstName, playerLastName):
		for char in ['\'', '.', ',', '`', '"']:
			playerFirstName = playerFirstName.replace(char, '')
			playerLastName = playerLastName.replace(char, '')
		
		return (playerFirstName, playerLastName)
		
		
	def buildURLName(self, playerName):
		print "playerName", playerName
		firstName = playerName.split()[0]
		
		lastName = ''
		for i in range(1, len(playerName.split())):
			lastName = lastName + '_' + playerName.split()[i]
		
		urlName = (firstName + lastName).lower()
		return urlName

	'''Spell checks player name (to avoid hitting the server)'''
        def spellCheckedResultForPlayerName(self, playerName):
            league = NBA_LEAGUE
            firstnames, lastnames, fullnames, playerURLNames = self.getPlayerListings(league)
            checker = SpellChecker(playerName, firstnames, lastnames)
            correctName = checker.correctFullName()
            if correctName == '':
                league = WNBA_LEAGUE
                firstnames, lastnames, fullnames, playerURLNames = self.getPlayerListings(league)
	        checker = SpellChecker(playerName, firstnames, lastnames)
	        correctName = checker.correctFullName()
		
	    if correctName == '':
	    	return (correctName, league, '')
	    else:
	    	return (correctName, league, playerURLNames[correctName.lower()])

	''' Helper method to scrape player stats from NBA.com '''
        def fetchCurrPlayerInfoFromNBAServer(self, playerName, soup, urlFullName):
		
		# Now, after a connection has been established, try scraping the site
		try:
			# The table of relevant statistics has:
			# <table ... class="playerStatTable careerAvg"> ... </table>
			# Unfortunately, both NBA.com and WBNA.com don't structure their content this way.
				
			position = ''
			twoPointPercentage = ''
			threePointPercentage = ''
			freeThrowPercentage = ''
			
			seasonAverages = soup.findAll(attrs={"class" : "playerStatTable careerAvg"})
			
			# If we have a NoneType for the averages table, throw an exception
			if seasonAverages == None:
				raise Exception('Invalid Player Searched')
			
			seasonAveragesTable = []
			if len(seasonAverages) > 1:
				seasonAveragesTable = seasonAverages[1]
				#print seasonAveragesTable
			else:
				seasonAveragesTable = seasonAverages[0]
		
			
			# Current season stats are stored in row 1 of the table.
			# Career stats are stored in row 2 of the table.
			currentSeasonStats = seasonAveragesTable.findAll("tr")[1]
			currSeasonNums = currentSeasonStats.findAll("td")
			
			# Column structuring is:
			# Season, Team, G, GS, MPG, FG%, 3p%, FT%, ...
			
			# ! spoletto: 5-2-11
			# Use str(...) here to prevent leaking the BeautifulSoup instances.
			twoPointPercentage = str(currSeasonNums[5].string)
			threePointPercentage = str(currSeasonNums[6].string)
			freeThrowPercentage = str(currSeasonNums[7].string)
			
			mainPlayerInfo = soup.find(attrs={"class" : "contentPad"})
			playerInfo = mainPlayerInfo.findAll("ul")[0]
			thisPlayerInfo = playerInfo.findAll("li")
		
			position = thisPlayerInfo[2].string.lower()
			
			position = string.upper(position[0]) + position[1:]
			
				
			# Link to player image -- different for both NBA and WNBA players
			playerPic = 'http://i.cdn.turner.com/nba/nba/media/act_' + urlFullName + '.jpg' 
			
			# Return player position, 3 core stats, picture URL, full name, and league
                        toReturn = (position, twoPointPercentage, threePointPercentage, freeThrowPercentage, playerPic, playerName, NBA_LEAGUE, errorMessages["NONE"])

			# Update the cache
                        searchNameToResultsLock.writer_enters()
                        searchNameToResults[playerName.lower()] = toReturn
                        searchNameToPurgeTime[playerName.lower()] = time.time() + SEARCH_NAME_TO_RESULTS_TIMEOUT
                        searchNameToResultsLock.writer_leaves()
                        
			return toReturn
		
		except:
			return (None, 0, 0, 0, None, '', None, errorMessages["STAT_PARSING_ERROR"])
		
	''' Helper method to scrape player stats from WNBA.com '''
	def fetchCurrPlayerInfoFromWNBAServer(self, playerName, soup, urlFullName):
		
		# Now, after a connection has been established, try scraping the site
		try:
						
			position = ''
			twoPointPercentage = ''
			threePointPercentage = ''
			freeThrowPercentage = ''
						
			# Make sure we gather the appropriate statistics
			seasonAvgs = soup.findAll(attrs={"class" : "averages player_stats stats"})
			seasonAveragesTable = []
			
			# If we have a NoneType for the averages table, throw an exception
			if seasonAvgs == None:
				raise Exception('Invalid Player Searched')
			
			# Index of our stats is different depending on if player is in the playoffs or not -- TODO:  USE AN API!!!!!
			indexOfStats = 3
			if len(seasonAvgs) > 1:
				seasonAveragesTable = seasonAvgs[1]
				indexOfStats = 2
			else:
				seasonAveragesTable = seasonAvgs[0]
			
			
			currSeasonStats = seasonAveragesTable.findAll("tr")[indexOfStats]
			currSeasonNums = currSeasonStats.findAll("td");
			
			# Column structuring is:
			# Season, Team, G, GS, MPG, FG%, 3p%, FT%, ...
			
			# ! spoletto: 5-2-11
			# Use str(...) here to prevent leaking the BeautifulSoup instances.
			twoPointPercentage = str(currSeasonNums[5].string)
			threePointPercentage = str(currSeasonNums[6].string)
			freeThrowPercentage = str(currSeasonNums[7].string)
			
			mainPlayerInfo = soup.find(attrs={"class" : "playerinfo"})
			playerInfo = mainPlayerInfo.find(attrs={"class" : "position"})
		
			# Our parse doesn't handle embedded tags, so we'll do it manually
			position = str(playerInfo)
			position = position.split('>')[1]
			
			position = position.split('<')[0]			
			
			position = string.upper(position[0]) + position[1:]
			
			# Store the correct name for the player -- with capitlized first and last names
			first = playerName.split()[0]
			last = playerName.split()[1]
			
			playerName = string.upper(first[0]) + string.lower(first[1:]) + ' ' + string.upper(last[0]) + string.lower(last[1:])
				
			# Link to player image -- different for both NBA and WNBA players
			playerPic = 'http://www.wnba.com/media/act_' + urlFullName + '.jpg'
			
			# Return player position, 3 core stats, picture URL, full name, and league
			toReturn = (position, twoPointPercentage, threePointPercentage, freeThrowPercentage, playerPic, playerName, WNBA_LEAGUE, errorMessages["NONE"])

			# Update the cache
			searchNameToResultsLock.writer_enters()
			searchNameToResults[playerName.lower()] = toReturn
			searchNameToPurgeTime[playerName.lower()] = time.time() + SEARCH_NAME_TO_RESULTS_TIMEOUT
			searchNameToResultsLock.writer_leaves()
                        
			return toReturn
		
		except:
			return (None, 0, 0, 0, None, '', None, errorMessages["STAT_PARSING_ERROR"])
			
	''' Helper function called by getCurrPlayer that delegates to the appropriate '''
	''' NBA or WNBA scraping method to yield player stats'''
	def fetchCurrPlayerInfoFromSpecifiedServer(self, playerName, playerURLName, league):
		
		league.lower()
			
		# The specified name must be lowercase and separated by an underscore, or else WNBA / NBA.com will hit a 404
		source = "http://www." + league + ".com/playerfile/" + playerURLName + "/index.html"
		
		# Try checking the appropriate league's site for player statistics
		soup = ''
		try:
		    response = urllib2.urlopen(source)
		    soup = BeautifulSoup(response)
		    
		except:
		    return (None, 0, 0, 0, None, '', None, errorMessages["SERVER_CONNECT_ERROR"])    
		
		# Now, call the appropriate helper function
		if league == NBA_LEAGUE:
			return self.fetchCurrPlayerInfoFromNBAServer(playerName, soup, playerURLName)
		else:
			return self.fetchCurrPlayerInfoFromWNBAServer(playerName, soup, playerURLName)
		
		
	'''Outputs:  Player position, twoPointPercentage, threePointPercentage, freeThrowPercentage'''
	'''First tries to find the player on NBA.com -- if this returns a 404 pages, tries WNBA.com'''
	def getCurrPlayerInfo(self, playerName):	
		
		# First check the cache. If we've already seen this search query before,
		# return the result.
		inCache = None
		timeout = None
		league = None
		
		searchNameToResultsLock.reader_enters()
		if playerName.lower() in searchNameToResults:
			inCache = searchNameToResults[playerName.lower()] 
			timeout = searchNameToPurgeTime[playerName.lower()]
		searchNameToResultsLock.reader_leaves()
                
		playerURLName = self.buildURLName(playerName)
		
		if inCache == None:
			# Maybe the user made a typo. Before we go off to the
			# NBA server, let's do a quick spellcheck test.
			print 'before we spell check'
			correctName, league, playerURLName = self.spellCheckedResultForPlayerName(playerName)
			if not correctName == '':
			   searchNameToResultsLock.reader_enters()
			   if correctName.lower() in searchNameToResults:
				   inCache = searchNameToResults[correctName.lower()] 
				   timeout = searchNameToPurgeTime[correctName.lower()]
			   searchNameToResultsLock.reader_leaves()
			   playerName = correctName
			else:
			   # If we couldn't spell correct the name, it must not be in the
			   # player list, so we should bail out now before we even try
			   # going to the server.
			   return (None, 0, 0, 0, None, '', None, errorMessages["NOT_IN_LEAGUE"])
                
		if inCache != None and time.time() < timeout:
			print "player info is cache is valid -- getCurrPlayerInfo. returning."
			return inCache
                
		# Check the appropriate site, based on what the spell-checker returned
		correctName, league, playerURLName = self.spellCheckedResultForPlayerName(playerName)
		liveStats = self.fetchCurrPlayerInfoFromSpecifiedServer(playerName, playerURLName, league)
			
		if liveStats[0] == None and inCache != None:
			# TODO:  NBA.com / WBNA.com likely changed their DOM. We should email the sysadmin
			# and return stale results from the cache.
			return inCache
                
		# Even if live stats is not valid, we don't have anything in the cache to
		# show the user. Give up and show them the error.
		return liveStats
			
	''' Master function that asks either NBA or WNBA .com for the player's career stats '''
	''' Inputs:  name of player, player's league'''
	''' Outputs: team, current season, stats'''
        def fetchCareerPlayerInfoFromSpecifiedServer(self, playerName, playerURLName, league):
            
			# The specified name must be lowercase and separated by an underscore,
			# or else NBA.com will hit a 404.	
			
			source = "http://www." + league + ".com/playerfile/" + playerURLName + "/career_stats.html"
			
			# Load the HTML
			reponse = ''
			soup = ''
			correctName = ''
			
			# Try checking the appropriate league for player statistics
			try:
				response = urllib2.urlopen(source)
				soup = BeautifulSoup(response)
				
			except:
				return '', '', [errorMessages["SERVER_CONNECT_ERROR"]]
			
			try:			
				team = ''
				currSeason = ''
				careerAveragesTable = ''
				careerAverageData = ''
				
				if league == NBA_LEAGUE:
					careerAveragesTable = soup.find(attrs={"class" : "playerStatTable careerAvg"})
					careerAverageData = careerAveragesTable.findAll("tr")
				else:
					careerAveragesTable = soup.find(attrs={"class" : "averages player_stats stats"})
					careerBodyData = careerAveragesTable.findAll("tbody")[0]
					careerAverageData = careerBodyData.findAll("tr")
				
				# We want to show any all-star, career, and season averages for the entire time that the player
				# has been in the league
				
				rows = len(careerAverageData)
				
				# To store our result after iterating over the part of the table that we're interested in
				careerNums = []
				
				foundTeam = False
				foundSeason = False
				
				# Iterate "up" the table to retrieve the most recent career statistics -- store in our careerNums table
				for i in range(1, rows):			
					currYear = []
					
					# Gather the Season, team, G, GS, FG, 3p, FT, OFF, DEF, RPG, APG, SPG, BPG, TO, PF, PPG values (0 through 16)
					for j in range(0, 17):
						
						# Store the rows per year
						currYear.append(str(careerAverageData[i].findAll("td")[j].string))
						
						# Store the team name
						if j == 1 and not (careerAverageData[rows - i].findAll("td")[1].string == '') and not foundTeam and not (careerAverageData[rows - i].findAll("td")[1].string == '--') and not (careerAverageData[rows - i].findAll("td")[1].string == ''):
							team = str(careerAverageData[rows - i].findAll("td")[1].string)
							foundTeam = True
							
						if j == 0 and not (careerAverageData[rows - i].findAll("td")[0].string == 'All-Star') and not foundSeason and not (careerAverageData[rows - i].findAll("td")[0].string == 'Career'):
							currSeason = str(careerAverageData[rows - i].findAll("td")[0].string)
							foundSeason = True
						
					careerNums.append(currYear)	
							
				# Find out which team the player is on by searching up the table until we come to a non-empty spot
				if (league == NBA_LEAGUE):
					team = teamCodeToName[team]
				else:
					team = teamCodeToNameWNBA[team]
				
				# Store results in the cache
				toReturn = (team, currSeason, careerNums)
				searchNameToCareerResultsLock.writer_enters()
				searchNameToCareerResults[playerName.lower()] = toReturn
				searchNameToCareerPurgeTime[playerName.lower()] = time.time() + SEARCH_NAME_TO_CAREER_RESULTS_TIMEOUT
				searchNameToCareerResultsLock.writer_leaves()
				return toReturn
			
			except:
				return '', '', [errorMessages["STAT_PARSING_ERROR"]]
            
                    
	'''Builds the table of career averages for a player '''
	''' Inputs:  name of player, player's league'''
	''' Outputs: team, current season, stats'''
	def getCareerPlayerInfo(self, playerName):
            
		print 'getting career player info'
		# First check the cache. If we've already seen this search query before,
		# return the result.
		inCache = None
		timeout = None
		league = None
		
		searchNameToCareerResultsLock.reader_enters()
		if playerName.lower() in searchNameToCareerResults:
			inCache = searchNameToCareerResults[playerName.lower()] 
			timeout = searchNameToCareerPurgeTime[playerName.lower()]
		searchNameToCareerResultsLock.reader_leaves()
		
		playerURLName = self.buildURLName(playerName)
		
		if inCache == None:
			# Maybe the user made a typo. Before we go off to the
			# NBA server, let's do a quick spellcheck test.
			correctName, league, playerURLName = self.spellCheckedResultForPlayerName(playerName)
			   
			if not correctName == '':
				searchNameToCareerResultsLock.reader_enters()
				if correctName.lower() in searchNameToCareerResults:
					inCache = searchNameToCareerResults[correctName.lower()] 
					timeout = searchNameToCareerPurgeTime[correctName.lower()]
				searchNameToCareerResultsLock.reader_leaves()
				playerName = correctName
			else:
				# If we couldn't spell correct the name, it must not be in the
				# player list, so we should bail out now before we even try
				# going to the server.
				return '', '', [errorMessages["NOT_IN_LEAGUE"]]
		
		if inCache != None and time.time() < timeout:
			print "player career info in cache is valid. returning."
			return inCache
                
		# Note, we don't have two different fetch methods here because the differences in parsing are trivial
		
		print 'before making request'
		correctName, league, playerURLName = self.spellCheckedResultForPlayerName(playerName)
		liveStats = self.fetchCareerPlayerInfoFromSpecifiedServer(playerName, playerURLName, league)
		if liveStats[0] == '' and inCache != None:
			# NBA.com / WBNA.com likely changed their DOM. We should email the sysadmin
			# and return stale results from the cache.
			return inCache
		
		# Even if live stats is not valid, we don't have anything in the cache to
		# show the user. Give up and show them the error.
		return liveStats
	
	''' Helper method that scrapes either NBA or WNBA .com for a complete player listing '''
	''' Inputs: league of player '''
	''' Outputs: player first names, player last names, player full names '''
        def fetchPlayerListingsFromNBAServer(self, league):
		
			#Make the specified league lowercase
			league.lower()
			
			source = "http://www." + league + ".com/players/"	
			
			playerAppendSource = "http://www." + league + ".com"
			try:
				# Load the HTML
				response = urllib2.urlopen(source)
				soup = BeautifulSoup(response)
				
				# List to store all player names represented as **last, first**
				playerFullNames = []
				firstNames = []
				lastNames = []
				playerURLNames = {}
				
				playerNames = soup.findAll(attrs={"class" : "thePlayers"})
				
				rows = len(playerNames)
				
				cols = 0
				
				# For each tag that we find matching "thePlayers" class
				for i in range(0, rows):
					
					currPlayer = str(playerNames[i].string)
					
						
					# If the element we're at has a comma in it, i.e. it is a listed player,
					# Store the players' full name, first name, and last name separately
					if (',' in currPlayer):
						try:
							playerFirstName = currPlayer.split(',')[1].lower()[1:]
							playerLastName = currPlayer.split(',')[0].lower()
							
							# Remove any non-url safe chars from firstName and lastName
							playerFirstName, playerLastName = self.cleanPlayerName(playerFirstName, playerLastName)
							
							# Put the names and URLs in the list
							firstNames.append(playerFirstName)
							lastNames.append(playerLastName)
				
							fullName = str(playerFirstName + ' ' + playerLastName).lower()
							currURL = str(playerAppendSource + str(playerNames[i]).split("href=\"")[1].split("\"")[0])
							playerURLNames[fullName] = currURL.split("/")[4]
							playerFullNames.append(fullName)
							
							# In case we have issues parsing one of the names from the site, just skip it
						except:
							continue
					
				# Return the first names, last names, and first and last name lists we've aggregated
				toReturn = (firstNames, lastNames, playerFullNames, playerURLNames)       
				leagueToPlayerListingsLock.writer_enters()
				leagueToPlayerListings[league.lower()] = toReturn
				leagueToPlayerListingsPurgeTime[league.lower()] = time.time() + LEAGUE_TO_PLAYER_LISTINGS_TIMEOUT
				leagueToPlayerListingsLock.writer_leaves()
				return toReturn
			except:
				return '', '', '', ''
		
        
	'''Returns the player listings for both the NBA and WNBA as a table of first and last names'''
	''' Inputs: league of player '''
	''' Outputs: player first names, player last names, player full names '''
	def getPlayerListings(self, league):
		
		# First check the cache. If we've already seen this search query before,
		# return the result.
		inCache = None
		timeout = None
		leagueToPlayerListingsLock.reader_enters()
		if league.lower() in leagueToPlayerListings:
			inCache = leagueToPlayerListings[league.lower()] 
			timeout = leagueToPlayerListingsPurgeTime[league.lower()]
		leagueToPlayerListingsLock.reader_leaves()
		
		if inCache != None and time.time() < timeout:
			print "player listings in cache is valid. returning."
			return inCache
		
		listings = self.fetchPlayerListingsFromNBAServer(league)
		if listings[0] == '' and inCache != None:
			# TODO:  NBA.com / WBNA.com likely changed their DOM. We should email the sysadmin
			# and return stale results from the cache.
			return inCache
		
		# Even if the listing is not valid, we don't have anything in the cache to
		# show the user. Give up and show them the error.
		return listings

    # Prints the career stats provided in careerStats
    # Each line corresponds to a season; each column to a particular statistic
    # The columns are ordered according to:
    # Season, Team, G, GS, FG, 3p, FT, OFF, DEF, RPG, APG, SPG, BPG, TO, PF, PPG
	def writeCareerStatsToFile(self, careerStats, outputFile):

		f = open(outputFile, 'w')

		out = ''

		# Don't include all-star or career numbers!
		for i in range(0,len(careerStats) - 2):
			for j in range(0,len(careerStats[i])):
				out = out + careerStats[i][j] + ', '
			out = out + '\n'

		print out

		f.write(out)
		f.close()
