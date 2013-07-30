
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

- Download code::

	git clone gituser@portal.socib.es:repositories/seaboard

- Install python dependencies::

    (virtualenv_name) $ pip install -r requirements.txt

- Install `lessc <http://lesscss.org/>`_ (via node package manager)::    

	npm install -g less

- Configure new virtualhost in apache::

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

