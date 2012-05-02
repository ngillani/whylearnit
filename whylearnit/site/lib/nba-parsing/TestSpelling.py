#!/usr/bin/python

from NBADotComParser import PlayerListings, SpellChecker
import sys

#Read in input -- argv[1] = Player first name, argv[2] = Player last name
if (len(sys.argv) < 3):
	print 'Args: <firstname> <lastname>'
	sys.exit()
	
firstNameTry = sys.argv[1]
lastNameTry = sys.argv[2]


#Check if player listing is accurate
l = PlayerListings()

firstnames, lastnames, fullnames = l.getPlayerListings('wnba')

#Print out full names
#print 'First names of players: ', lastnames

#Now, try out Peter Norvig's spell checker 
name = str(firstNameTry + ' ' + lastNameTry)
checker = SpellChecker(name, firstnames, lastnames)

suggestion = checker.correctFullName()

print 'original attempt: ', name

if(suggestion == ''):
	print 'Could not determine a player suggestion.  Please try your search again'
else:
	print 'spell checker suggestion: ', suggestion




