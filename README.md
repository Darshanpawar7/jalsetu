# 🚰 JalSetu - Smart Water Management System

> **Winning Solution for Samved Smart Governance Hackathon**  
> MIT Vishwaprayag University × Solapur Municipal Corporation

## 🎯 Overview

JalSetu is a comprehensive smart water management system designed specifically for Solapur city. It addresses the critical water distribution challenges through IoT sensors, AI-powered analytics, and citizen engagement.

### ✨ Key Features

- **Real-time Monitoring**: Live sensor data from water network
- **AI Priority Engine**: Automatically prioritizes issues based on multiple factors
- **Citizen Engagement**: WhatsApp-based complaint system with auto-ticketing
- **Equity Monitoring**: Tracks water distribution fairness across wards
- **Predictive Analytics**: Machine learning for leak prediction
- **Demo Mode**: Complete hackathon demo sequence with storytelling

## 🚀 Quick Start

### Prerequisites

- Node.js v16+ and npm
- PostgreSQL 12+ with PostGIS extension
- MQTT Broker (Mosquitto)

### 1. Database Setup

```bash
# Install PostgreSQL and PostGIS
sudo apt-get install postgresql postgis

# Create database
sudo -u postgres psql
CREATE DATABASE jalsetu;
\c jalsetu
CREATE EXTENSION postgis;

# Run schema (from backend/database/schema.sql)
\i backend/database/schema.sql