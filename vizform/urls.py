from django.conf.urls import patterns, include, url

urlpatterns = patterns('vizform.views',
	url(r'^result','result'),
	url(r'^text','text'),
	url(r'^','index'),
)