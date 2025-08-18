# Makefile pentru AI Prompt Templates
# Include comenzi pentru CI/CD, development și deployment

.PHONY: help install dev build start test lint format clean
.PHONY: workflows-test workflows-validate workflows-deps
.PHONY: ci-test ci-deploy ci-cleanup ci-monitoring
.PHONY: db-check db-migrate db-backup
.PHONY: security-audit security-fix
.PHONY: performance-test lighthouse-test
.PHONY: backup-full backup-verify

# Variabile
NODE_VERSION := 20
NPM_VERSION := 10
PYTHON_VERSION := 3.11

# Culori pentru output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Funcții pentru logging
define log
	@echo -e "$(BLUE)[$(shell date +'%Y-%m-%d %H:%M:%S')]$(NC) $1"
endef

define success
	@echo -e "$(GREEN)[SUCCESS]$(NC) $1"
endef

define warning
	@echo -e "$(YELLOW)[WARNING]$(NC) $1"
endef

define error
	@echo -e "$(RED)[ERROR]$(NC) $1"
endef

# Target principal
help: ## Afișează acest ajutor
	@echo "AI Prompt Templates - Makefile"
	@echo "=============================="
	@echo
	@echo "Comenzi disponibile:"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "Pentru mai multe detalii: make <comandă>"

# Development
install: ## Instalează dependențele
	$(call log,"Instalând dependențele...")
	@npm ci
	$(call success,"Dependențele au fost instalate")

dev: ## Rulează aplicația în mod development
	$(call log,"Pornind aplicația în mod development...")
	@npm run dev

build: ## Construiește aplicația pentru production
	$(call log,"Construind aplicația...")
	@npm run build
	$(call success,"Aplicația a fost construită")

start: ## Pornește aplicația construita
	$(call log,"Pornind aplicația...")
	@npm start

# Testing & Quality
test: ## Rulează toate testele
	$(call log,"Rulează toate testele...")
	@npm run test:ci

test-watch: ## Rulează testele în mod watch
	$(call log,"Rulează testele în mod watch...")
	@npm run test:watch

test-e2e: ## Rulează testele E2E
	$(call log,"Rulează testele E2E...")
	@npm run test:e2e

test-performance: ## Rulează testele de performanță
	$(call log,"Rulează testele de performanță...")
	@npm run test:performance

lint: ## Rulează linting
	$(call log,"Rulează linting...")
	@npm run lint

format: ## Formatează codul
	$(call log,"Formatează codul...")
	@npm run format

format-check: ## Verifică formatarea codului
	$(call log,"Verifică formatarea codului...")
	@npm run format:check

type-check: ## Verifică tipurile TypeScript
	$(call log,"Verifică tipurile TypeScript...")
	@npm run type-check

# CI/CD Workflows
workflows-test: ## Testează toate workflow-urile CI/CD
	$(call log,"Testează toate workflow-urile CI/CD...")
	@./scripts/test-workflows.sh -a

workflows-validate: ## Validează toate workflow-urile CI/CD
	$(call log,"Validează toate workflow-urile CI/CD...")
	@./scripts/test-workflows.sh -v

workflows-deps: ## Verifică dependențele pentru workflow-uri
	$(call log,"Verifică dependențele pentru workflow-uri...")
	@./scripts/test-workflows.sh -d

workflow-test: ## Testează un workflow specific (folosește: make workflow-test WORKFLOW=nume)
	$(call log,"Testează workflow-ul: $(WORKFLOW)")
	@./scripts/test-workflows.sh $(WORKFLOW)

# CI/CD Jobs
ci-test: ## Rulează job-urile de testare CI
	$(call log,"Rulează job-urile de testare CI...")
	@npm run lint
	@npm run type-check
	@npm run test:ci
	@npm run test:e2e
	$(call success,"Job-urile de testare CI au fost rulate cu succes")

ci-deploy: ## Rulează job-urile de deployment CI
	$(call log,"Rulează job-urile de deployment CI...")
	@npm run build
	@npm run test:smoke
	$(call success,"Job-urile de deployment CI au fost rulate cu succes")

ci-cleanup: ## Rulează job-urile de cleanup CI
	$(call log,"Rulează job-urile de cleanup CI...")
	@npm run clean
	$(call success,"Job-urile de cleanup CI au fost rulate cu succes")

ci-monitoring: ## Rulează job-urile de monitoring CI
	$(call log,"Rulează job-urile de monitoring CI...")
	@npm run test:performance
	@npm run lighthouse
	$(call success,"Job-urile de monitoring CI au fost rulate cu succes")

# Database
db-check: ## Verifică schema database-ului
	$(call log,"Verifică schema database-ului...")
	@npm run db:check

db-migrate: ## Rulează migrațiile database-ului
	$(call log,"Rulează migrațiile database-ului...")
	@echo "Implementează logica pentru migrații"

db-backup: ## Creează backup pentru database
	$(call log,"Creează backup pentru database...")
	@echo "Implementează logica pentru backup"

# Security
security-audit: ## Rulează audit-ul de securitate
	$(call log,"Rulează audit-ul de securitate...")
	@npm run security:audit

security-fix: ## Repară vulnerabilitățile de securitate
	$(call log,"Repară vulnerabilitățile de securitate...")
	@npm run security:fix

# Performance
performance-test: ## Rulează testele de performanță
	$(call log,"Rulează testele de performanță...")
	@npm run test:performance

lighthouse-test: ## Rulează testele Lighthouse
	$(call log,"Rulează testele Lighthouse...")
	@npm run lighthouse

# Backup & Recovery
backup-full: ## Creează backup complet
	$(call log,"Creează backup complet...")
	@echo "Implementează logica pentru backup complet"

backup-verify: ## Verifică backup-urile
	$(call log,"Verifică backup-urile...")
	@echo "Implementează logica pentru verificarea backup-urilor"

# Dependencies
deps-check: ## Verifică dependențele
	$(call log,"Verifică dependențele...")
	@npm run deps:check

deps-update: ## Actualizează dependențele
	$(call log,"Actualizează dependențele...")
	@npm run deps:update

deps-audit: ## Audit-ul dependențelor
	$(call log,"Audit-ul dependențelor...")
	@npm audit

# Deployment
deploy-dev: ## Deploy pe development
	$(call log,"Deploy pe development...")
	@npm run deploy:dev

deploy-prod: ## Deploy pe production
	$(call log,"Deploy pe production...")
	@npm run deploy:prod

rollback: ## Rollback la versiunea anterioară
	$(call log,"Rollback la versiunea anterioară...")
	@npm run rollback

# Maintenance
clean: ## Curăță fișierele temporare
	$(call log,"Curăță fișierele temporare...")
	@npm run clean
	@rm -rf node_modules
	@rm -rf .next
	@rm -rf coverage
	@rm -rf .nyc_output
	$(call success,"Fișierele temporare au fost curățate")

clean-install: clean install ## Curăță și reinstalează dependențele

# Monitoring & Health
health-check: ## Verifică sănătatea aplicației
	$(call log,"Verifică sănătatea aplicației...")
	@echo "Implementează logica pentru health check"

monitoring: ## Rulează monitoring-ul
	$(call log,"Rulează monitoring-ul...")
	@echo "Implementează logica pentru monitoring"

# Utils
check-env: ## Verifică variabilele de mediu
	$(call log,"Verifică variabilele de mediu...")
	@echo "NODE_VERSION: $(NODE_VERSION)"
	@echo "NPM_VERSION: $(NPM_VERSION)"
	@echo "PYTHON_VERSION: $(PYTHON_VERSION)"

version: ## Afișează versiunea aplicației
	$(call log,"Versiunea aplicației:")
	@node -p "require('./package.json').version"

# Development shortcuts
dev-setup: install ## Setup complet pentru development
	$(call log,"Setup complet pentru development...")
	@npm run type-check
	@npm run lint
	@npm run test:ci
	$(call success,"Setup-ul pentru development este complet")

quick-test: lint type-check test ## Test rapid (lint + type-check + test)

# Production shortcuts
prod-setup: install build ## Setup complet pentru production
	$(call log,"Setup complet pentru production...")
	@npm run test:ci
	@npm run test:e2e
	@npm run test:performance
	$(call success,"Setup-ul pentru production este complet")

# Emergency
emergency-clean: ## Curăță complet în caz de urgență
	$(call warning,"CURĂȚARE COMPLETĂ DE URGENȚĂ!")
	@rm -rf node_modules
	@rm -rf .next
	@rm -rf coverage
	@rm -rf .nyc_output
	@rm -rf logs/*
	@rm -rf .cache
	@npm cache clean --force
	$(call success,"Curățarea de urgență este completă")

# Info
info: ## Afișează informații despre proiect
	$(call log,"Informații despre proiect:")
	@echo "Nume: $(shell node -p "require('./package.json').name")"
	@echo "Versiune: $(shell node -p "require('./package.json').version")"
	@echo "Descriere: $(shell node -p "require('./package.json').description")"
	@echo "Autor: $(shell node -p "require('./package.json').author")"
	@echo "License: $(shell node -p "require('./package.json').license")"
	@echo "Node.js: $(shell node --version)"
	@echo "npm: $(shell npm --version)"

# Default target
.DEFAULT_GOAL := help
