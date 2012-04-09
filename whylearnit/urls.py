from django.conf.urls.defaults import patterns, include, url
from django.conf import settings
from whylearnit.settings import *
import os

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'whylearnit.views.index', name='index'),
    # url(r'^whylearnit/', include('whylearnit.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

	# Path to media directory
	(r'^site/(?P<path>.*)$', 'django.views.static.serve', {'document_root': os.path.join(PROJECT_PATH, 'site'),}),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^loadpacket/', 'whylearnit.views.getPacketContent'),
	url(r'^storePacketResponse/', 'whylearnit.views.storePacketResponse'),
    url(r'^foreducators/', 'whylearnit.views.getForEducators'),
    url(r'^about/', 'whylearnit.views.getAbout'),

    # For testing purposes only!
    url(r'^testexercise/', 'whylearnit.views.testExercise'),
)
