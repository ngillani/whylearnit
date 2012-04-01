from django.db import models

# Create your models here.

class Interest(models.Model):
	name = models.CharField(max_length = 9999)
	description = models.CharField(max_length = 99999)

	def __unicode__(self):
		return self.name

class Standard(models.Model):
	name = models.CharField(max_length = 9999)
	code = models.CharField(max_length = 9999)
	description = models.CharField(max_length = 99999)	

	def __unicode__(self):
		return self.name

class Resource(models.Model):
	name = models.CharField(max_length = 9999)
	description = models.CharField(max_length = 99999)
	link = models.CharField(max_length = 9999)

	def __unicode__(self):
		print 'resource name: ', self.name
		return self.name

class Packet(models.Model):
	name = models.CharField(max_length = 9999)
	standard = models.ForeignKey(Standard)
	interest = models.ForeignKey(Interest)
	vid_link = models.CharField(max_length = 9999)
	js_file = models.CharField(max_length = 9999)
	related_packets = models.ManyToManyField('self', blank=True)
	description = models.CharField(max_length = 99999)
	resources = models.ManyToManyField(Resource, blank=True)

	def __unicode__(self):
		return self.name

class Question(models.Model):
	text = models.CharField(max_length = 9999)
	hint = models.CharField(max_length = 9999, blank=True)
	packet = models.ForeignKey(Packet)

	def __unicode__(self):
		return self.text

class Choice(models.Model):
	question = models.ForeignKey(Question)
	text = models.CharField(max_length = 9999)

	def __unicode__(self):
		return self.question

class Response(models.Model):
	response_packet = models.ForeignKey(Packet)
	response_question = models.ForeignKey(Question)

	# Store IP Address of respondant
	respondant = models.CharField(max_length = 9999)
	response_date = models.DateTimeField('date response entered')

	# TODO - add in a field to store the username once we
	# enable registration

	def __unicode__(self):
		return self.response_question
