#! /usr/bin/python

# Author: Nabeel Gillani (ngillani), modeled after Norvig's spell checker, 
# found here:  http://norvig.com/spell-correct.html'''
# This class is an adapted spell checker that uses edit distances of <=2 to 
# Clean misspelled inputs.  It then ensures that the corrected inputs, in our case, specific to 
# Our NBA / WNBA Player listings, are actually valid player names

import time
import urllib2, collections
import string

class SpellChecker:
	
	'''Create a new instance of the spell checker'''
	def __init__(self, nameAttempt, firstNames, lastNames):
		self._alphabet = 'abcdefghijklmnopqrstuvwxyz'
		self._firstNames = firstNames
		self._lastNames = lastNames
		self._nameAttempt = nameAttempt
		self._fNameModel = self.buildProbModel(firstNames)
		self._lNameModel = self.buildProbModel(lastNames)
		

	def correctFullName(self):
		# Find the suggested first and last name corrections
		firstNameCorrection = self.correctName(self._nameAttempt.split()[0], self._fNameModel)
		lastNameCorrection = self.correctName(self._nameAttempt.split()[1], self._lNameModel)
		
		'''Now, see if these are in the same indices in our array -- if so, we have a valid 
		   suggestion, and if not, the user's out of luck!'''		
		
		# Number of first names -- should be the same as the number of last names
		numNames= len(self._firstNames)
		
		# Search for a matching first and last name by iterating through both lists
		index = -1
		for i in range(0, numNames):
				for j in range(0, numNames):
					if(self._firstNames[i] == firstNameCorrection and self._lastNames[j] == lastNameCorrection and i == j):
						index = i
		
		#If we failed to find a match after iterating through our first and last name lists, return an empty string
		if index < 0:
			return ''
		
		#Otherwise, capitalize the first letters of the first and last name and return
		else:
			fName = firstNameCorrection[0].upper()
			lName = lastNameCorrection[0].upper()
			return str(fName+firstNameCorrection[1:] + " " + lName+lastNameCorrection[1:])
		   
	
	'''Let's analyze the occurence of instances of words in our dictionary.  
	   The dictionary is either a listing of first names, last names, or full names
	   the lambda: 1 sets a default key of 1 for words that may only occur once to avoid 
	   setting a 0 probability for these words'''
	def buildProbModel(self, names):
		model = collections.defaultdict(lambda: 1)
		for n in names:
			model[n] += 1
		return model
		
	'''Build a list of typos that the user could have made.  This includes deletes, transposes, replaces, and 
	   inserts.  We find these typos by considering word "splits", or words and subwords contained in the original word'''
	def edits1(self, name, model):
		splits = [(name[:i], name[i:]) for i in range(len(name) + 1)]
		deletes = [a + b[1:] for a, b in splits if b]
		transposes = [a + b[1] + b[0] + b[2:] for a, b in splits if len(b) > 1]
		replaces = [a + c + b[1:] for a, b in splits for c in self._alphabet if b]
		inserts = [a + c + b for a, b in splits for c in self._alphabet]
		return set(deletes + transposes + replaces + inserts)
	
	'''Find words that are 2-edits away from the actual word'''
	def known_edits2(self, name, model):
		return set(e2 for e1 in self.edits1(name, model) for e2 in self.edits1(e1, model) if e2 in model)
		
	'''Find words that are 1-edit away from the actual word'''
	def known(self, names, model):
		return set(n for n in names if n in model)
	
	'''Correct the name based on the model we are using (either for first or last names)'''
	def correctName(self, name, model):
		possibilities = self.known([name], model) or self.known(self.edits1(name, model), model) or self.known_edits2(name, model) or [name]
		return max(possibilities, key=lambda n: model[n])
	
		