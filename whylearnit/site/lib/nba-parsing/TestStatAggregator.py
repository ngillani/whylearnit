#!/usr/bin/python

from NBADotComParser import PlayerStats, PlayerListings

p = PlayerStats("Lebron James")

#Test Current Statistics Scraping
position, fg, three_p, ft, img_link = p.getCurrPlayerInfo()

print 'Image link is: ', img_link

print 'position is: ', position
print 'fg% ', fg
print '3p% ', three_p
print 'ft% ', ft 

#Test Career Statistics Scraping
career_totals = p.getCareerPlayerInfo()

print 'career totals are: ',career_totals


#Check if player listing is accurate
l = PlayerListings()

firstnames, lastnames, fullnames = l.getPlayerListings('nba')

#print 'full names of player: ', fullnames

#print 'length of firstnames: ', len(firstnames)
#print 'length of lastnames: ', len(lastnames)




