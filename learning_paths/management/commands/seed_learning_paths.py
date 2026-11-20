from django.core.management.base import BaseCommand
from learning_paths.models import LearningPath, LearningModule, LearningLevel


PATH_DATA = [
    {
        "title": "Python Backend Developer",
        "slug": "python-backend-developer",
        "description": "Build a strong Python backend foundation, work with databases and APIs, and finish with deployment-ready backend skills.",
        "target_role": "Python Backend Developer",
        "level": LearningLevel.BEGINNER,
        "estimated_hours": 32,
        "modules": [
            ("Python foundations", "Syntax, data types, control flow, functions and modules.", "Learn variables, collections, functions, imports, exceptions and virtual environments.", 180, "https://docs.python.org/3/tutorial/", "Python official tutorial", ["Write a function that validates an email-like string.", "Build a command-line expense tracker."]),
            ("Object-oriented Python", "Classes, inheritance, composition and clean code.", "Practise classes, instance/class methods, inheritance, composition, properties and dataclasses.", 210, "https://docs.python.org/3/tutorial/classes.html", "Python classes", ["Model a library with Book and Member classes.", "Refactor duplicated code using composition."]),
            ("Data structures and problem solving", "Lists, dictionaries, sets, stacks, queues and complexity.", "Choose data structures for common operations and analyse time and space complexity.", 240, "https://docs.python.org/3/tutorial/datastructures.html", "Python data structures", ["Solve Two Sum using a dictionary.", "Implement a stack and queue."]),
            ("SQL and PostgreSQL", "Relational data, joins, constraints, indexes and transactions.", "Design normalized tables, write joins and aggregations, and understand transactions and indexes.", 240, "https://www.postgresql.org/docs/current/tutorial.html", "PostgreSQL tutorial", ["Design tables for a job portal.", "Write a query joining applicants and applications."]),
            ("Django fundamentals", "Models, ORM, views, URLs, templates, forms and migrations.", "Build a Django app with models, validation, views and migrations.", 300, "https://docs.djangoproject.com/en/stable/intro/", "Django getting started", ["Build a CRUD application for tasks.", "Add filtering and pagination to a list view."]),
            ("Django REST Framework", "Serializers, APIViews, generic views, viewsets and permissions.", "Create REST APIs, validate input, serialize relationships and protect endpoints.", 300, "https://www.django-rest-framework.org/tutorial/quickstart/", "DRF quickstart", ["Build CRUD endpoints for projects.", "Add JWT authentication and object ownership checks."]),
            ("Testing, deployment and portfolio project", "Automated tests, environment variables, production settings and deployment.", "Test API behaviour, configure environment variables and deploy a documented backend project.", 450, "https://docs.djangoproject.com/en/stable/topics/testing/", "Django testing", ["Write tests for permissions and validation.", "Deploy an API and document setup instructions."]),
        ],
    },
    {
        "title": "Django REST API Developer",
        "slug": "django-rest-api-developer",
        "description": "A role-focused path for designing secure, reliable and maintainable APIs with Django REST Framework.",
        "target_role": "Django REST Framework Developer",
        "level": LearningLevel.INTERMEDIATE,
        "estimated_hours": 26,
        "modules": [
            ("HTTP and REST fundamentals", "HTTP methods, status codes, resources and REST conventions.", "Understand request/response cycles, idempotency, status codes, filtering and pagination.", 150, "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", "HTTP overview", ["Design endpoints for a course platform.", "Choose status codes for common API outcomes."]),
            ("Serializers and validation", "ModelSerializer, nested data, custom fields and validation.", "Validate incoming data and shape reliable API responses.", 210, "https://www.django-rest-framework.org/api-guide/serializers/", "DRF serializers", ["Create a nested read serializer.", "Add field-level and object-level validation."]),
            ("Views, routers and querysets", "APIView, generics, viewsets, filtering and query optimization.", "Select the right view abstraction and avoid N+1 queries.", 240, "https://www.django-rest-framework.org/api-guide/generic-views/", "Generic views", ["Build a filtered list endpoint.", "Optimize related-object queries with select_related and prefetch_related."]),
            ("Authentication and permissions", "JWT, permissions, ownership and throttling.", "Protect APIs and test access boundaries.", 240, "https://www.django-rest-framework.org/api-guide/permissions/", "DRF permissions", ["Restrict records to their owner.", "Write tests for anonymous and authenticated requests."]),
            ("API testing and documentation", "APITestCase, APIClient, schema and error handling.", "Test success and failure paths and document request/response shapes.", 240, "https://www.django-rest-framework.org/api-guide/testing/", "DRF testing", ["Test create, update, invalid payload and forbidden access.", "Document an endpoint with examples."]),
            ("Capstone API", "Build and deploy a complete API service.", "Combine authentication, relational data, validation, tests and deployment.", 480, "https://docs.djangoproject.com/en/stable/howto/deployment/", "Django deployment", ["Build a project-management API.", "Deploy it and prepare a short architecture explanation."]),
        ],
    },
    {
        "title": "Full Stack Developer",
        "slug": "full-stack-developer",
        "description": "Connect frontend interfaces with backend services, databases, authentication and deployment.",
        "target_role": "Full Stack Developer",
        "level": LearningLevel.INTERMEDIATE,
        "estimated_hours": 35,
        "modules": [
            ("Web fundamentals", "HTML, CSS, JavaScript, browser and HTTP basics.", "Understand semantic markup, responsive layouts, JavaScript fundamentals and browser requests.", 210, "https://developer.mozilla.org/en-US/docs/Learn", "MDN web learning", ["Build a responsive profile page.", "Fetch and render data from a public API."]),
            ("React fundamentals", "Components, props, state, effects and forms.", "Build reusable components and manage UI state.", 300, "https://react.dev/learn", "React learn", ["Build a searchable list with filters.", "Create a controlled form with validation."]),
            ("Backend APIs", "Django REST Framework API design and validation.", "Create endpoints, serializers, authentication and permissions.", 300, "https://www.django-rest-framework.org/", "Django REST Framework", ["Build a CRUD API.", "Connect a React form to your API."]),
            ("Database design", "PostgreSQL tables, relationships, constraints and queries.", "Model relational data and query it efficiently.", 210, "https://www.postgresql.org/docs/current/tutorial.html", "PostgreSQL tutorial", ["Design a schema for a social networking app.", "Write joins and aggregate queries."]),
            ("Frontend-backend integration", "Axios, authentication, loading states and errors.", "Integrate forms, token refresh and API error states.", 240, "https://axios-http.com/docs/intro", "Axios documentation", ["Implement login and protected routes.", "Handle loading, empty and API error states."]),
            ("Testing and deployment", "Frontend checks, API tests, environment configuration and hosting.", "Prepare a reproducible full-stack release.", 360, "https://vite.dev/guide/", "Vite guide", ["Run frontend and backend checks.", "Deploy both layers and write a README."]),
        ],
    },
    {
        "title": "SQL and Database Foundations",
        "slug": "sql-database-foundations",
        "description": "Learn relational database concepts and practical SQL for backend and software developer interviews.",
        "target_role": "Backend / Software Developer",
        "level": LearningLevel.BEGINNER,
        "estimated_hours": 18,
        "modules": [
            ("Relational database concepts", "Tables, rows, keys and relationships.", "Understand primary keys, foreign keys, cardinality and normalization.", 150, "https://www.postgresql.org/docs/current/tutorial.html", "PostgreSQL tutorial", ["Model students and courses with a many-to-many relationship.", "Explain primary key versus unique constraint."]),
            ("SQL querying", "SELECT, WHERE, ORDER BY, GROUP BY and HAVING.", "Retrieve and summarize data with clear queries.", 210, "https://www.postgresql.org/docs/current/tutorial-select.html", "SELECT tutorial", ["Find the top five customers by order value.", "Group interview sessions by status."]),
            ("Joins and subqueries", "INNER, LEFT joins, subqueries and common table expressions.", "Combine data across tables and break complex queries into steps.", 240, "https://www.postgresql.org/docs/current/queries-table-expressions.html", "Table expressions", ["List all users including users with no interviews.", "Find records above their category average."]),
            ("Indexes and transactions", "Indexes, query plans, ACID and isolation.", "Choose indexes based on query patterns and reason about transactions.", 240, "https://www.postgresql.org/docs/current/indexes.html", "PostgreSQL indexes", ["Explain why an index may slow writes.", "Describe a transaction for transferring funds."]),
            ("Database design practice", "Schema design and query exercises.", "Build a small normalized schema and query it from an application.", 240, "https://www.postgresql.org/docs/current/ddl.html", "Data definition", ["Design a job portal database.", "Write queries for applicant and job analytics."]),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed starter learning paths and modules. Safe to run more than once."

    def handle(self, *args, **options):
        paths_created = 0
        modules_created = 0
        modules_updated = 0

        for path_data in PATH_DATA:
            modules = path_data["modules"]
            path_defaults = {key: value for key, value in path_data.items() if key != "modules"}
            path, created = LearningPath.objects.update_or_create(
                slug=path_data["slug"], defaults=path_defaults
            )
            paths_created += int(created)

            for index, item in enumerate(modules, start=1):
                title, description, content, minutes, url, label, tasks = item
                _, module_created = LearningModule.objects.update_or_create(
                    learning_path=path,
                    order=index,
                    defaults={
                        "title": title,
                        "description": description,
                        "content": content,
                        "estimated_minutes": minutes,
                        "resource_url": url,
                        "resource_label": label,
                        "practice_tasks": tasks,
                        "is_published": True,
                    },
                )
                if module_created:
                    modules_created += 1
                else:
                    modules_updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Learning paths seeded: {paths_created} paths created; "
            f"{modules_created} modules created; {modules_updated} modules updated."
        ))
