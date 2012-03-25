import models
from whylearnit.exercises.models import *
import json

# Returns all info relevant to a packet, using the helper methods described below
def getAllPacketContent(packetId):
	packet_content = {}
	packet_content['AllQuestions'] = getQuestionInfo(packetId)
	packet_content['AllResources'] = getRelatedResources(packetId)
	packet_content['AllMetadata'] = getExerciseMetadata(packetId)
	packet_content['AllRelatedPackets'] = getRelatedPackets(packetId)


	# jsonify and return!
	json_packet_content = json.dumps(packet_content)
	
	return json_packet_content

# Returns the set of questions, the options 
# (if applicable), and hints for these questions
def getQuestionInfo(packetId):

	questions_to_return = []
	questions = Question.objects.filter(packet__pk = packetId)
	num_questions = len(questions)	

	# Build a list of questions to then return 
	for i in range(0,num_questions):

		curr_question = {}
		curr_question['QuestionText'] = questions[i].text
		curr_question['Hint'] = questions[i].hint

		# Check to see if there are any choices that are associated 
		# with this question
		
		answer_choices = Choice.objects.filter(question__pk = questions[i].id)
		num_choices = len(answer_choices)
		
		if(num_choices > 0):

			all_choices = []
			for j in range(0,num_choices):
				all_choices.append(answer_choices[j].text)
			
			curr_question['Choices'] = all_choices

		# append the current question and move onto the next
		questions_to_return.append(curr_question)

	return questions_to_return

# Returns resources that relate to this exercise
def getRelatedResources(packetId):
	
	curr_packet = Packet.objects.filter(pk = packetId)[0]
	all_resources = curr_packet.resources.all();

	num_resources = len(all_resources)	
	
	resources_to_return = []

	# Build a list of questions to then return 
	for i in range(0,num_resources):

		curr_resource = {}
		curr_resource['Name'] = all_resources[i].name
		curr_resource['Description'] = all_resources[i].description
		curr_resource['Link'] = all_resources[i].link

		resources_to_return.append(curr_resource)
	
	return resources_to_return

# Returns the js file and appropriate video link 
def getExerciseMetadata(packetId):

	packet_info = Packet.objects.filter(pk = packetId)[0]

	# Get the standard + interest corresponding to this packet

	interest = Interest.objects.filter(pk = packet_info.interest.pk)[0]
	standard = Standard.objects.filter(pk = packet_info.standard.pk)[0]

	metadata_to_return = {}

	# Gather all relevant metadata info
	metadata_to_return['Interest'] = interest.name
	metadata_to_return['Standard'] = standard.name
	metadata_to_return['StandardCode'] = standard.code
	metadata_to_return['JSFile'] = packet_info.js_file
	metadata_to_return['VideoLink'] = packet_info.vid_link
	metadata_to_return['Description'] = packet_info.description

	return metadata_to_return	

# Returns the URLs / video links to related packets
# TODO:  Optimize response time when user clicks
# On a related packet by pulling in all content + 
# Exercise info for related packets when loading a 
# Given packet?
def getRelatedPackets(packetId):

	packet_info = Packet.objects.filter(pk = packetId)[0]
	related_packets = packet_info.related_packets.all()
	all_related_packets = []	

	num_related_packets = len(related_packets)

	for i in range(0,num_related_packets):

		curr_rel_packet = {}
		rel_packet_info = Packet.objects.filter(packet_pk = related_packets[i])

		curr_rel_packet['RelName'] = rel_packet_info.name
		curr_rel_packet['RelLink'] = rel_packet_info.vid_link
		curr_rel_packet['RelDescription'] = rel_packet_info.description
		curr_rel_packet['RelInterest'] = Interest.objects.filter(interest__id == rel_packet_info.interest)
		curr_rel_packet['RelStandard'] = Standard.objects.filter(interest__id == rel_packet_info.standard)
		
		all_related_packets.append(curr_rel_packet)

	return all_related_packets

