# MoodTrack

### A cloud-native emotional journaling app with AI-powered insights and companion chat.



<p align="center">
  <img src="./assets/2.png" width="280" alt="Screenshot 1" />
  <video src="./assets/demo.mp4" width="420" controls></video>
  <img src="./assets/3.png" width="280" alt="Screenshot 2" />
</p>

MoodTrack is a personal emotional journal application that helps users track their daily thoughts and feelings, monitor mood trends over time, and engage with an AI companion for reflective prompts and emotional support.

**Why MoodTrack?** Research shows that journaling improves mental health in 68% of cases (2022 study), while AI chatbot interactions have been proven to reduce depression symptoms (2024 meta-analysis).

### Author(s)
[@SugarStoneMaster](https://github.com/SugarStoneMaster)

---

## Architecture

<p align='center'> 
    <!-- Architecture diagram will go here -->
    <i>Architecture diagram coming soon</i>
</p>

<p align="center">
  <img src="./architecture.png" alt="Architecture diagram" />
</p>

The architecture is divided into four zones: **Client**, **Development**, **Azure**, and **External Services**.

### Client Layer
Users interact with MoodTrack through native mobile apps on Android and iOS. The frontend is built with **React Native**, providing a single cross-platform codebase that reduces development time and simplifies maintenance.

### Azure Kubernetes Service (AKS)
The React Native app connects to an **AKS cluster** via a public IP exposed through an Ingress controller. A Load Balancer service routes traffic to multiple pods, each running a replica of the **FastAPI** backend Docker image. This setup ensures:
- Horizontal scalability
- High availability
- Secure public traffic management

### Database & Configuration
Pods communicate with an **Azure SQL Database** (serverless tier) that automatically suspends when idle and scales with user growth. Configuration is centralized in **Azure App Configuration**, enabling dynamic feature flags (e.g., enable/disable chatbot, daily prompts) without redeployment.

### Async Processing Pipeline
When a user creates a journal entry:
1. The entry ID is pushed to an **Azure Storage Queue**
2. An **Azure Function** (queue-triggered) retrieves the ID
3. The function fetches entry text from the database
4. Text is sent to **Azure AI Language Service** for sentiment analysis
5. Results are written back to the database

This decoupled architecture allows sentiment processing to run asynchronously without blocking the user experience.

### AI Companion Chat
Users can interact with an **AI chatbot companion** powered by **OpenAI GPT-4o mini** during the writing process. The companion provides reflective prompts and encourages self-exploration rather than generating ready-made content. This natural, personalized dialogue improves engagement compared to rule-based systems.

### Observability & Monitoring
All requests to pods and Functions are traced by **Azure Application Insights**, collecting metrics and logs. Custom workbooks and alerts trigger notifications if:
- Error rate exceeds 5%
- Latency spikes occur

Alerts are sent via email to administrators, enabling proactive issue resolution without manual monitoring.

### CI/CD Pipeline
Development follows a fully automated **CI/CD pipeline**:
1. On every `git push`, Docker images are built and pushed to **Azure Container Registry**
2. Secrets are applied via Kubernetes
3. Helm charts deploy the application to AKS
4. Smoke tests validate the deployment

This eliminates manual errors, accelerates releases, and ensures consistency across environments.

### Load Testing
**Azure Load Testing** validates system capacity with simulated scenarios:
- 100 concurrent users
- Actions: login, create entry, read entries

These tests measure real-world scalability and prevent bottlenecks before production.

---

## Scalability & Resilience

- **AKS** auto-scales pods based on traffic
- **SQL Serverless** reduces costs during low activity and scales with demand
- **Async pipeline** (Queue → Function → AI Service) prevents user-facing delays
- **App Configuration** enables zero-downtime feature flag toggling
- **Application Insights** provides real-time visibility into errors, latency, and SLO compliance

---

## Tech Stack

**Frontend:**
- React Native (TypeScript)
- React Navigation

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- Pydantic schemas

**Azure Services:**
- Azure Kubernetes Service (AKS)
- Azure SQL Database (Serverless)
- Azure App Configuration
- Azure Storage (Queue)
- Azure Functions
- Azure AI Language Service
- Azure Application Insights
- Azure Container Registry
- Azure Load Testing

**External Services:**
- OpenAI GPT-4o mini

**DevOps:**
- Docker
- Kubernetes (Helm)
- GitHub Actions

---

## Azure Environment Setup

> **⚠️ IN PROGRESS**  
> Infrastructure-as-Code (IaC) with Terraform is currently being developed. Manual setup instructions will be replaced with automated Terraform provisioning soon.

---

## Installation and Usage

> **⚠️ IN PROGRESS**  


### Deployment
The application is deployed automatically via GitHub Actions CI/CD pipeline when pushing to the `main` branch.

---

## Future Work

**Microservices Architecture:**  
Split the monolith into independent services (core API, LLM gateway, background processors) for isolated failures, targeted autoscaling, and faster per-component deployments.

**API Management:**  
Introduce Azure API Management for API versioning, rate limiting, centralized authentication, and a developer portal for third-party integrations.

**Push Notifications:**  
Implement production-grade push notifications via **Azure Notification Hubs** (APNs + FCM). Requires Apple Developer account for iOS delivery.

**AI Hardening:**  
Add prompt/response guardrails, strict token budgets, and fallback mechanisms (e.g., disable chat via feature flag) to maintain cost predictability.

---

## Contributions

Contributions are very much appreciated. Please describe your changes clearly in your pull request to facilitate review.

If you encounter any bugs or issues unrelated to your local environment, please open a new issue with reproducible steps.

---

> **Disclaimer**: MoodTrack is not a substitute for professional mental health care.