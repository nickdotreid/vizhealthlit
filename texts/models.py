from django.db import models

class Text(models.Model):
    class Meta:
        verbose_name = 'text'
        verbose_name_plural = 'texts'

    title = models.CharField(null=False, blank=False, max_length=250)
    text = models.CharField(null=False, blank=False, max_length=5000)
    hidden = models.BooleanField(null=False, blank=False, default=False) 

    def __unicode__(self):
        return self.title
    