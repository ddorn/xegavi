SHELL := /bin/bash

APP := xentlabs
HOST := pine
DEST := /srv/$(APP)
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

BUILD_DIR := $(ROOT)/.next
DIST_DIR := $(ROOT)/dist

ENV_LOCAL := $(ROOT)/.env-prod
ENV_REMOTE := $(DEST)/.env

LOAD_LOCAL := $(ROOT)/public/load.json
LOAD_REMOTE := $(DEST)/public/load.json

.PHONY: install build clean prepare-dist rsync deploy put-env put-load service-install restart status logs

install:
	cd $(ROOT) && npm install

build:
	cd $(ROOT) && npm run build

clean:
	rm -rf $(DIST_DIR)

prepare-dist: clean
	mkdir -p $(DIST_DIR)
	# Copy standalone server
	cp -a $(BUILD_DIR)/standalone/. $(DIST_DIR)/
	# Include static assets required at runtime
	mkdir -p $(DIST_DIR)/.next/static
	[ -d $(BUILD_DIR)/static ] && cp -a $(BUILD_DIR)/static/. $(DIST_DIR)/.next/static/ || true
	# Include public assets (incl. load.json)
	mkdir -p $(DIST_DIR)/public
	[ -d $(ROOT)/public ] && cp -a $(ROOT)/public/. $(DIST_DIR)/public/ || true

rsync:
	rsync -az --delete $(DIST_DIR)/ $(HOST):$(DEST)/

deploy: install build prepare-dist rsync
	ssh $(HOST) 'systemctl restart $(APP).service && journalctl -u $(APP).service -n 100 -f'

put-env:
	test -f $(ENV_LOCAL) && rsync -az $(ENV_LOCAL) $(HOST):$(ENV_REMOTE) || echo "Skip: $(ENV_LOCAL) not found"

put-load:
	test -f $(LOAD_LOCAL) && rsync -az $(LOAD_LOCAL) $(HOST):$(LOAD_REMOTE) || echo "Skip: $(LOAD_LOCAL) not found"

service-install:
	scp $(ROOT)/$(APP).service $(HOST):/etc/systemd/system/$(APP).service
	ssh $(HOST) 'systemctl daemon-reload && systemctl enable --now $(APP).service && journalctl -u $(APP).service -n 100 -f'

restart:
	ssh $(HOST) 'systemctl restart $(APP).service && journalctl -u $(APP).service -n 100 -f'

status:
	ssh $(HOST) 'systemctl status $(APP).service --no-pager'

logs:
	ssh $(HOST) 'journalctl -u $(APP).service -n 200 -f'