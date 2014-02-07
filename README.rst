
Installation
------------

- [RECOMENDED] Install this web application in a python virtualenv.
	Install virtualenvwrapper::

	$ pip install virtualenvwrapper

	Follow `this instructions <http://virtualenvwrapper.readthedocs.org/en/latest/command_ref.html>`_  to create a new environment and activate it.

- Install ubuntu dependencies:
	a) libxml2-dev libxslt1-dev (for feedparser)
	b) libqrencode-dev (for qrencoder)
	c) nodejs (for lessc)
	d) libjpeg libjpeg-dev libfreetype6 libfreetype6-dev zlib1g-dev (for PIL, crop images)
	e) uwsgi (o pip install) +  libapache2-mod-uwsgi supervisor (for uwsgi)


- Download code::

	git clone gituser@portal.socib.es:repositories/seaboard

- Install python dependencies::

    (virtualenv_name) $ pip install -r requirements.txt

- Install `lessc <http://lesscss.org/>`_ (via node package manager)::

	npm install -g less

- [DEPRECATED] Configure new virtualhost in apache::

	<VirtualHost *:80>

	        DocumentRoot "/var/www/seaboard"

	        ServerName seaboardtest.socib.es
	        ServerAlias *.seaboardtest.socib.es

	        Alias /static/ /var/www/seaboard/static/
	        AliasMatch ^/views/(.*).html /var/www/seaboard/static/widgets/$1/$1.html

	        WSGIScriptAlias / /var/www/seaboard/seaboard/wsgi.py
	        WSGIPythonPath /var/www/seaboard:PATH_TO_VIRTUAL_ENV/lib/python2.7/site-packages

	        <Directory "/var/www/seaboard">
	                Options Indexes FollowSymLinks MultiViews
	                Allow from all
	        </Directory>

	        ErrorLog /var/log/apache2/seaboard.socib.es.error.log
	        LogLevel info

	        CustomLog /var/log/apache2/seaboard.socib.es.access.log combined
	        ServerSignature On

	</VirtualHost>

- Configure seaboard with uwsgi::

	Note: can't install (or not easy) in Ubuntu 11.04. Try gunicorn

	1. Install uwsgi, libapache2-mod-uwsgi and supervisor

	2. Prepare uwsgi config folder. Create /etc/uwsgi/apps-enabled

	3. Prepare uwsgi log folder. Create /var/log/uwsgi and change owner to www-data

	4. Create a symbolic link to uwsgi.ini::

		ln -s /path/to/seaboard/seaboard/uwsgi.ini /etc/uwsgi/apps-enabled/seaboard.ini

	5. Configure supervisor in order to load uwsgi server with OS. File /etc/supervisor/conf.d/uwsgi.conf::

		[program:uwsgi-emperor]
		command=/usr/local/bin/uwsgi --emperor "/etc/uwsgi/apps-enabled/*.ini" --die-on-term --master --uid www-data --gid www-data --logto /var/log/uwsgi/emperor.log --emperor-stats 127.0.0.1:1716
		autostart=true
		autorestart=true
		redirect_stderr=true


	6. Modify virtualhost in apache::

		<VirtualHost *:80>

		        DocumentRoot "/var/www/seaboard"

		        ServerName seaboardtest.socib.es
	        	ServerAlias *.seaboardtest.socib.es

		        <Location />
		            SetHandler uwsgi-handler
		            uWSGISocket 127.0.0.1:49152
		        </Location>

		        <Location /static>
		            SetHandler none
		        </Location>

		        <Location /views>
		            SetHandler none
		        </Location>

	        	<Directory "/var/www/seaboard">
	                Options Indexes FollowSymLinks MultiViews
	                Allow from all
	        	</Directory>

		        Alias /static/ /var/www/seaboard/static/
		        AliasMatch ^/views/(.*).html /var/www/seaboard/static/widgets/$1/$1.html

		        ErrorLog /var/log/apache2/seaboard.socib.es.error.log
		        LogLevel info

		        CustomLog /var/log/apache2/seaboard.socib.es.access.log combined
		        ServerSignature On

		</VirtualHost>

- Monitor uwsgi::

	1. Install uwsgitop::

		pip install uwsgitop

	2. Connect uwsgitop to uwsgi stats socket::

		- Emperor::

			uwsgitop 127.0.0.1:1718

		- Seaboard::

			uwsgitop 127.0.0.1:1717




- Configure seaboard with gunicorn::

	1. Install gunicorn::

		pip install gunicorn

	2. Install supervisor with apt-get or aptitude (before, aptitude install python-meld3 && pip install meld3==0.6.7)

	3. Prepare gunicorn log folder. Create /var/log/gunicorn and change owner to www-data

	4. Configure supervisor in order to load gunicorn servir with OS. File /etc/supervisor/conf.d/gunicorn-gisservices.conf::

		[program:gunicorn-gisservices]
		command=/path/to/virtualenv/bin/gunicorn -c /var/www/gisservices/gunicorn_conf.py seaboard.wsgi:application
		directory=/var/www/seaboard
		user=www-data
		autostart=true
		autorestart=true
		priority=991
		stopsignal=KILL

		stdout_logfile=/var/log/gunicorn/seaboard.log
		stdout_logfile_maxbytes=1MB
		stdout_logfile_backups=2
		stderr_logfile=/var/log/gunicorn/seaboard.error.log
		stderr_logfile_maxbytes=1MB
		stderr_logfile_backups=2

	5. Run supervisor (reload with new config):
		service supervisor stop
		unlink /var/run//supervisor.sock
		service supervisor start

	6. Enable proxy_http module in apache2::

		a2enmod proxy_http

	7. Modify virtualhost in apache::

		<VirtualHost *:80>

		        DocumentRoot "/var/www/seaboard"

		        ServerName seaboardtest.socib.es
	        	ServerAlias *.seaboardtest.socib.es

		        ProxyPreserveHost On
		        <Proxy *>
		            Order deny,allow
		            Allow from all
		        </Proxy>

		        # Serve static
		        ProxyPass /favicon.ico !
		        ProxyPass /static/ !
		        ProxyPass /views/ !

		        # proxy a la resta
		        ProxyPass / http://localhost:49153/
		        ProxyPassReverse / http://localhost:49153/

		        Alias /static/ /var/www/seaboard/static/
		        AliasMatch ^/views/(.*).html /var/www/seaboard/static/widgets/$1/$1.html

	        	<Directory "/var/www/seaboard">
	                Options Indexes FollowSymLinks MultiViews
	                Allow from all
	        	</Directory>

		        ErrorLog /var/log/apache2/seaboard.socib.es.error.log
		        LogLevel info

		        CustomLog /var/log/apache2/seaboard.socib.es.access.log combined
		        ServerSignature On

		</VirtualHost>


- Gunicorn notes::

	1. Show gunicorn processes::

		ps aux | grep gunicorn

	2. Reload gunicorn processes::

		supervisorctl pid gunicorn-seaboard | xargs kill -HUP

		Or::

		supervisorctl restart gunicorn-seaboard

- Gstats (gunicorn stats)::

	1. Install packages:

		pip install gstats
		pip install pyzmq
		pip install setproctitle (optional)

	2. Modify gunicorn_conf.py (with pre_request and post_request)

	3. Init collector::

		gstats-collectd -s tcp://127.0.0.2:2345

	3. Show stats::

		gstatsctl -c tcp://127.0.0.1:2345 stats


