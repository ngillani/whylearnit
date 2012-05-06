from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext, Context
from whylearnit.exercises.models import *
from whylearnit.exercises.exercise_json_provider import *
import json
import datetime

def index(request):

    return render_to_response('index.html')

# TODO: Change to render foreducators.html
def getForEducators(request):

	return render_to_response('educators.html')

# TODO: Change to render about.html
def getAbout(request):

	return render_to_response('index.html')




def packet(request, folder, packet):
    context = { 'folder': folder, 'packet': packet, 'exercise_template_path': 'exercise-templates/%s/%s.html' % (folder, packet) }

    return render_to_response('packet.html', context)

''' Function to retreive exercise content from the DB and 
    return to the user.

    input - request (which holds information about which
    exercise to load from the database - i.e., the name
	of the packet)

    output - json object with the following structure
	(see exercises.exercise_json_provider for exact
	details)
    
	{ AllQuestions: [question info],
	  AllResources: [resource info],
	  AllMetaData : [packet metadata],
	  AllRelatedPackets : [related packet info]		
	}

'''
def getPacketJS(request, folder, packet):

        # note packet will probably switch from 'videogame.js' to a number, i.e.
        # replacing packetId. URL routing should be updated
        url = 'exercise-content/' + folder + '/' + packet + '.js';
        print url

	packet = Packet.objects.get(js_file__startswith = packet)

	questions = Question.objects.filter(packet__pk = packet.id).all()

        for q in questions: 
            q.choices = []
            choices = Choice.objects.filter(question = q)
            for choice in choices:
              q.choices.append(str(choice.text))
            print q.choices

        context = {
            'id': packet.id,
            'interest': packet.interest,
            'title': packet.name,
            'description': packet.description,
            'videolink': packet.vid_link,
            'related': packet.related_packets.all(),
            'questions': questions
        }

        return render_to_response(url, context, mimetype="text/javascript");



''' Function to retrieve content for the "For Educators" page
	TODO:  Write code for this
'''
def getEducatorContent(request):
	pass



''' Function to retrieve content for the homepage

	Returns all content according to three possible
	views (By standard, by interest, by popularity)

	The non-active views are caches on the client side
'''
def getHomepageContent(request):
	pass


'''Function to store a user's packet responses in the
   database - called iteratively by storePacketResponse

   This function expects a dictionary for a given question
   response with values for the following keys:

   1. js_file - name of the js file for the packet
   2. question_id - database id (primary key) of the
                 question that this is a response to
   3. response_text - the user's response to the question
   4. ip_address - the user's ip address 

'''
def storeQuestionResponse(currQuestionDict, js_file, ip_address, packet_id):

	question_id = currQuestionDict['question_id']
	response_text = currQuestionDict['response_text']
	
 	# For now, we don't check to see if this is an updated response
	# Just store all responses as unique!
	resp = Response()
	resp.response_packet = packet_id
	resp.response_question = question_id
	resp.respondant = ip_address
	resp.response_date = datetime.datetime.now()

	resp.save()

'''Function that loops over a dictionary that is comprised of
   question : question_info elements, where the contents of
   question_info are described in the function above
'''
def storePacketResponse(request):
	
	# First, use json to load the dictionary of all questions
	response_dict = json.loads(request.POST['all_responses'])
	js_file = request.POST['js_file']

	# Unique identifier for now.  TODO - add login info!
	ip_address = request.POST['ip_address']

	# Now, get the js file and corresponding question info
	packet_id = Packet.objects.filter(js_file__startswith = js_file)[0].id

	# Next, iterate over all keys and store the question responses
	# in the DB
	for key in response_dict:
		storeQuestionResponse(response_dict[key], js_file, ip_address, packet_id)

	# TODO:  render_to_response something!
