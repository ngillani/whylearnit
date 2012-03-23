from django.db import models

# Create your models here.

class Interest(models.Model):
	name = models.CharField(max_length = 9999)
	description = models.CharField(max_length = 99999)

class Standard(models.Model):
	name = models.CharField(max_length = 9999)
	code = models.CharField(max_length = 9999)
	description = models.CharField(max_length = 99999)	

class Resource(models.Model):
	name = models.CharField(max_length = 9999)
	description = models.CharField(max_length = 99999)
	link = models.CharField(max_length = 9999)

class Packet(models.Model):
	name = models.CharField(max_length = 9999)
	standard = models.ForeignKey(Standard)
	interest = models.ForeignKey(Interest)
	vid_link = models.CharField(max_length = 9999)
	js_file = models.CharField(max_length = 9999)
	related_packets = models.ManyToManyField('self')
	description = models.CharField(max_length = 99999)
	resources = models.ManyToManyField(Resource)

class Question(models.Model):
	question = models.CharField(max_length = 9999)
	hint = models.CharField(max_length = 9999)
	packet = models.ForeignKey(Packet)

class Choice(models.Model):
	question = models.ForeignKey(Question)
	text = models.CharField(max_length = 9999)

