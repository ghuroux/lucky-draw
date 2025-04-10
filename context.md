Project Context & Requirements:

We’re developing a web application for a monthly lucky draw system designed for a golf day charity event. Each month, a new event is created with its own settings. Here are the key requirements:
	1.	Events:
	•	Each event represents a monthly draw.
	•	During event setup, the admin specifies an entry cost (which can vary by event) and the number of winners to pick.
	•	Each event also includes prize details (prize name, description) and the draw date when winners are chosen.
	2.	Entrants & Entries:
	•	Each entry is purchased by an individual (entrant) who provides their first name, last name, email, cell phone number, and date of birth.
	•	Entrants are normalized into their own table to support multiple entries per event.
	•	A person can buy more than one entry for an event.
	•	When an entry is created, it is assigned an incremental sequence number (unique per event), representing their ticket number.
	•	There is an option for the entrant to make an extra donation as part of their entry.
	3.	Winners Selection:
	•	When the admin presses the “draw” button, winners are chosen at random.
	•	The event setup declares the number of winners to select, and all winners are chosen in the same draw.
	•	Despite an entrant being able to have multiple entries, they can only win once per event (business logic must enforce this).
	4.	Administration:
	•	The application supports multiple roles for admins (e.g., SUPERADMIN, STAFF).
	•	Admins can manage events, view and add entries, and trigger the draw.

Tech Stack:
	•	Frontend: React with TypeScript, styled with Tailwind CSS.
	•	Backend: Next.js (Node.js) using API routes.
	•	Database: PostgreSQL managed via Supabase.
	•	We’ll use Prisma as the ORM to interact with the database.
	•	Authentication: Supabase Auth (leveraging Supabase’s built-in auth system).
	•	Email: NodeMailer for sending emails.
	•	Version Control & Deployment: Git for version control and CI/CD; Vercel for hosting and deployment.
	•	Development Tools: Cursor AI will be used as the coding assistant.

Prisma Schema Overview:
We’ll have the following models:
	•	AdminUser: Manages admin accounts, storing username, hashed password, role, and createdAt timestamp.
	•	Event: Represents each monthly draw with settings such as entryCost, numberOfWinners, prize details, draw timestamp (drawnAt), and a list of winning entry IDs.
	•	Entrant: Represents an individual participant (first name, last name, email, cell phone, date of birth) who can submit multiple entries.
	•	Entry: Links an Entrant to an Event. Contains a unique incremental sequence number per event, an optional donation amount, and timestamps.

Objective:
Begin by creating a new Prisma schema that captures these models and relationships. Following this, build the essential API endpoints using Next.js API routes (for managing events, entries, and performing the draw), and then develop the basic pages (login, dashboard, event detail, and history).

This prompt sets the foundation for generating code snippets and further development tasks. Please ensure that all generated code adheres to these requirements and is modular and maintainable.