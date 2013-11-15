from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from django.db.models import permalink

# Create your models here.


class Zone(models.Model):
    """A zone contains one or more locations (for example, pdp = Platja de Palma, contains HMGF i CID)."""
    code = models.CharField(_('code'), max_length=20, unique=True)
    name = models.CharField(_('name'), max_length=200)
    description = models.CharField(_('description'), max_length=250, blank=True)
    id_platform = models.IntegerField(_('platform id'), null=True, blank=True)
    latlong = models.CharField(_('location'), max_length=50, blank=True, null=True)
    beach_flag_url = models.CharField(_('Beach flag status url'), max_length=250, blank=True)
    sapo_image_path = models.CharField(_('Sapo image paths'), max_length=250, blank=True)

    date_added = models.DateTimeField(_('date added'), auto_now_add=True)
    user_add = models.ForeignKey(User, blank=True, null=True, related_name='add-zone')
    date_modified = models.DateTimeField(_('date modified'), auto_now=True)
    user_modify = models.ForeignKey(User, blank=True, null=True, related_name='modified-zone')

    class Meta:
        db_table = 'seaboard_zone'
        verbose_name = _('Zone')
        verbose_name_plural = _('Zones')

    def __unicode__(self):
        return u"%s - %s" % (self.code, self.name)

    @permalink
    def get_absolute_url(self):
        return ('seawidgets_dash', None, {
            'zone': self.code,
        })


class Location(models.Model):
    """Specific location inside a zone."""
    code = models.CharField(_('code'), max_length=20, unique=True)
    name = models.CharField(_('name'), max_length=200)
    zone = models.ForeignKey(Zone)

    description = models.CharField(_('description'), max_length=250, blank=True)
    location = models.CharField(_('location'), max_length=50, blank=True, null=True)

    # dash configuration
    proud_heading = models.CharField(_('proud heading'), max_length=100, blank=True)
    proud_body = models.CharField(_('proud body'), max_length=600, blank=True)
    timelapse_cameras = models.CharField(_('timelapse cameras'), max_length=50, blank=True)
    latest_cameras = models.CharField(_('latest cameras'), max_length=50, blank=True)
    rss_url = models.CharField(_('RSS url'), max_length=250, blank=True)
    dash_template = models.CharField(_('Dash template'), max_length=100, blank=True)

    date_added = models.DateTimeField(_('date added'), auto_now_add=True)
    user_add = models.ForeignKey(User, blank=True, null=True, related_name='add-location')
    date_modified = models.DateTimeField(_('date modified'), auto_now=True)
    user_modify = models.ForeignKey(User, blank=True, null=True, related_name='modified-location')

    class Meta:
        db_table = 'seaboard_location'
        verbose_name = _('Location')
        verbose_name_plural = _('Locations')

    def __unicode__(self):
        return u"%s - %s" % (self.code, self.name)

    @property
    def display_name(self):
        if self.zone.code == self.code:
            return self.name

        return u"%s - %s" % (self.zone.name, self.name)



    @permalink
    def get_absolute_url(self):

        if self.zone.code == self.code:
            return ('seawidgets_dash', None, {
                'zone_code': self.zone.code,
            })

        return ('seawidgets_dash', None, {
            'zone_code': self.zone.code,
            'location_code': self.code,
        })
