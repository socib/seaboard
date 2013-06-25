# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Zone'
        db.create_table('seaboard_zone', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('code', self.gf('django.db.models.fields.CharField')(unique=True, max_length=20)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('id_platform', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('latlong', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('date_added', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('user_add', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='add-zone', null=True, to=orm['auth.User'])),
            ('date_modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user_modify', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='modified-zone', null=True, to=orm['auth.User'])),
        ))
        db.send_create_signal(u'seawidgets', ['Zone'])

        # Adding model 'Location'
        db.create_table('seaboard_location', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('code', self.gf('django.db.models.fields.CharField')(unique=True, max_length=20)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('zone', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['seawidgets.Zone'])),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('proud_heading', self.gf('django.db.models.fields.CharField')(max_length=70, blank=True)),
            ('proud_body', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('timelapse_cameras', self.gf('django.db.models.fields.CharField')(max_length=50, blank=True)),
            ('latest_cameras', self.gf('django.db.models.fields.CharField')(max_length=50, blank=True)),
            ('rss_url', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('date_added', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('user_add', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='add-location', null=True, to=orm['auth.User'])),
            ('date_modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user_modify', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='modified-location', null=True, to=orm['auth.User'])),
        ))
        db.send_create_signal(u'seawidgets', ['Location'])


    def backwards(self, orm):
        # Deleting model 'Zone'
        db.delete_table('seaboard_zone')

        # Deleting model 'Location'
        db.delete_table('seaboard_location')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'seawidgets.location': {
            'Meta': {'object_name': 'Location', 'db_table': "'seaboard_location'"},
            'code': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'}),
            'date_added': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'date_modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'latest_cameras': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'proud_body': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'proud_heading': ('django.db.models.fields.CharField', [], {'max_length': '70', 'blank': 'True'}),
            'rss_url': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'timelapse_cameras': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'user_add': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'add-location'", 'null': 'True', 'to': u"orm['auth.User']"}),
            'user_modify': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'modified-location'", 'null': 'True', 'to': u"orm['auth.User']"}),
            'zone': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['seawidgets.Zone']"})
        },
        u'seawidgets.zone': {
            'Meta': {'object_name': 'Zone', 'db_table': "'seaboard_zone'"},
            'code': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'}),
            'date_added': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'date_modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'id_platform': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'latlong': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'user_add': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'add-zone'", 'null': 'True', 'to': u"orm['auth.User']"}),
            'user_modify': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'modified-zone'", 'null': 'True', 'to': u"orm['auth.User']"})
        }
    }

    complete_apps = ['seawidgets']