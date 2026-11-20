from django.core.management.base import BaseCommand
from django.db import transaction

from interviews.models import InterviewDomain, QuestionBankItem


QUESTION_DATA = [
    {
        "domain": "Python",
        "category": "Programming Language",
        "description": "Core Python concepts, language features and problem solving.",
        "topic": "Core Python",
        "difficulty": "beginner",
        "estimated_minutes": 3,
        "question_text": "What is the difference between a list and a tuple in Python?",
        "sample_answer": "Both lists and tuples are ordered collections. A list is mutable, which means its elements can be added, removed or changed after creation. A tuple is immutable, so its elements cannot be changed after creation. Lists use square brackets, while tuples usually use parentheses.",
        "key_points": [
            "Lists are mutable; tuples are immutable.",
            "Lists are useful when a collection needs to change.",
            "Tuples are useful for fixed collections and can be used as dictionary keys when all their elements are hashable.",
        ],
    },
    {
        "domain": "Python", "category": "Programming Language", "description": "Core Python concepts, language features and problem solving.",
        "topic": "Functions", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "What is a mutable default argument in Python, and why can it cause bugs?",
        "sample_answer": "Default argument values are created once when the function is defined, not each time it is called. When a mutable object such as a list or dictionary is used as a default, changes made during one call can remain for later calls. A common solution is to use None as the default and create a new object inside the function.",
        "key_points": ["Default values are evaluated when the function is defined.", "A mutable default can retain state between calls.", "Use None and initialize the list or dictionary inside the function."],
    },
    {
        "domain": "Python", "category": "Programming Language", "description": "Core Python concepts, language features and problem solving.",
        "topic": "Concurrency", "difficulty": "advanced", "estimated_minutes": 5,
        "question_text": "What is the Global Interpreter Lock (GIL), and how does it affect CPU-bound and I/O-bound work?",
        "sample_answer": "In the standard CPython implementation, the GIL allows only one thread at a time to execute Python bytecode in a process. This limits parallel execution of CPU-bound Python code using threads. Threads can still be useful for I/O-bound work because the interpreter can switch between threads while one is waiting. For CPU-bound parallelism, multiprocessing or native extensions that release the GIL may be appropriate.",
        "key_points": ["The GIL is an implementation detail of standard CPython, not a rule for every Python implementation.", "Threads are often useful for I/O-bound tasks.", "Multiprocessing can use multiple processes for CPU-bound work."],
    },
    {
        "domain": "Python", "category": "Programming Language", "description": "Core Python concepts, language features and problem solving.",
        "topic": "Iterators and Generators", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "What is a generator in Python, and how is it different from returning a list?",
        "sample_answer": "A generator produces values one at a time, usually with yield, and resumes from where it paused when the next value is requested. It does not need to keep every generated value in memory. A function that returns a list usually creates the complete list before the caller uses it.",
        "key_points": ["Generators are lazy and produce values on demand.", "They can reduce memory use for large sequences.", "A generator is generally consumed as it is iterated."],
    },
    {
        "domain": "Django", "category": "Backend Development", "description": "Django framework concepts, ORM, request processing and application design.",
        "topic": "Middleware", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "How does Django middleware work, and when would you write custom middleware?",
        "sample_answer": "Middleware is a framework of hooks that processes requests and responses globally. A request passes through middleware before reaching the view, and the response passes back through the middleware stack. Custom middleware is useful for cross-cutting concerns such as request logging, correlation IDs, custom security checks or adding common response headers.",
        "key_points": ["Middleware wraps request and response processing.", "Order matters because middleware runs in sequence on the request and in reverse on the response.", "Use middleware for behaviour shared across many views, not for view-specific business logic."],
    },
    {
        "domain": "Django", "category": "Backend Development", "description": "Django framework concepts, ORM, request processing and application design.",
        "topic": "ORM and Queries", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "What is the difference between select_related() and prefetch_related() in Django?",
        "sample_answer": "select_related() uses SQL joins and is intended for single-valued relationships such as ForeignKey and OneToOneField. prefetch_related() performs additional queries and joins the results in Python, so it can handle multi-valued relationships such as ManyToManyField and reverse ForeignKey relationships. Both help avoid repeated database queries when loading related objects.",
        "key_points": ["select_related() is generally for ForeignKey and OneToOneField.", "prefetch_related() supports many-to-many and reverse relationships.", "Use query inspection to confirm that an optimization actually helps."],
    },
    {
        "domain": "Django", "category": "Backend Development", "description": "Django framework concepts, ORM, request processing and application design.",
        "topic": "Signals", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "What are Django signals, and what is one situation where you would use them?",
        "sample_answer": "Signals allow parts of a Django application to be notified when certain events occur. For example, a post_save receiver can create a related profile when a user is created. Signals should be used carefully because they can hide control flow; for important business operations, an explicit service function is often easier to understand and test.",
        "key_points": ["Signals use senders and receivers.", "post_save runs after a model instance is saved.", "Avoid putting complex business workflows into signals."],
    },
    {
        "domain": "Django", "category": "Backend Development", "description": "Django framework concepts, ORM, request processing and application design.",
        "topic": "Models and Migrations", "difficulty": "beginner", "estimated_minutes": 3,
        "question_text": "What are Django migrations, and what do makemigrations and migrate do?",
        "sample_answer": "Migrations are version-controlled instructions that describe changes to database schema. makemigrations examines model changes and creates migration files. migrate applies unapplied migration files to the configured database.",
        "key_points": ["makemigrations creates migration files.", "migrate applies those migrations to the database.", "Commit migration files with the related model changes."],
    },
    {
        "domain": "Django REST Framework", "category": "Backend Development", "description": "DRF serializers, views, API design, authentication and permissions.",
        "topic": "Serializers", "difficulty": "intermediate", "estimated_minutes": 5,
        "question_text": "How do DRF serializers validate incoming data and convert model instances to JSON-friendly data?",
        "sample_answer": "A serializer converts complex objects such as model instances into primitive data that can be rendered as JSON. For incoming data, pass the data to the serializer, call is_valid(), and then access validated_data or save(). Field-level validation can use validate_field_name(), while object-level validation can use validate().",
        "key_points": ["Use serializer(instance) for serialization.", "Use serializer(data=request.data) for deserialization and validation.", "Call is_valid() before accessing validated_data or saving."],
    },
    {
        "domain": "Django REST Framework", "category": "Backend Development", "description": "DRF serializers, views, API design, authentication and permissions.",
        "topic": "Relationships", "difficulty": "advanced", "estimated_minutes": 5,
        "question_text": "When would you use PrimaryKeyRelatedField instead of a nested serializer for a relationship?",
        "sample_answer": "PrimaryKeyRelatedField represents a relationship using the related object's primary key. It is a good choice when the API only needs to accept or return an identifier. A nested serializer represents related objects with their fields and is useful when the API needs to expose or write nested object data. For writable nested serializers, creation and update behaviour generally needs to be implemented explicitly.",
        "key_points": ["PrimaryKeyRelatedField is concise and identifier-based.", "Nested serializers expose related object fields.", "Writable nested operations need clear create/update logic."],
    },
    {
        "domain": "Django REST Framework", "category": "Backend Development", "description": "DRF serializers, views, API design, authentication and permissions.",
        "topic": "Views and ViewSets", "difficulty": "beginner", "estimated_minutes": 3,
        "question_text": "What is the difference between APIView and a ModelViewSet in DRF?",
        "sample_answer": "APIView gives explicit control over HTTP methods such as get() and post(). ModelViewSet provides a common set of CRUD actions for a model and can be connected to a router to generate URLs. APIView is useful for custom workflows, while ModelViewSet is convenient for standard resource endpoints.",
        "key_points": ["APIView provides explicit method handlers.", "ModelViewSet supplies common CRUD actions.", "Choose based on how much custom behaviour the endpoint needs."],
    },
    {
        "domain": "Django REST Framework", "category": "Backend Development", "description": "DRF serializers, views, API design, authentication and permissions.",
        "topic": "Authentication and Permissions", "difficulty": "advanced", "estimated_minutes": 5,
        "question_text": "How are authentication and permissions different in Django REST Framework?",
        "sample_answer": "Authentication identifies the user making the request and sets request.user and request.auth. Permissions decide whether that user is allowed to perform the requested action. An endpoint can authenticate a user successfully and still deny access because the permission policy is not satisfied.",
        "key_points": ["Authentication answers: who is making the request?", "Permissions answer: is this request allowed?", "Apply object-level permissions when access depends on a specific record."],
    },
    {
        "domain": "SQL", "category": "Database", "description": "SQL queries, relational databases, indexing and transaction concepts.",
        "topic": "Joins", "difficulty": "beginner", "estimated_minutes": 3,
        "question_text": "What is the difference between an INNER JOIN and a LEFT JOIN?",
        "sample_answer": "An INNER JOIN returns rows where the join condition matches in both tables. A LEFT JOIN returns every row from the left table and matching rows from the right table; when no match exists, right-side columns are NULL.",
        "key_points": ["INNER JOIN keeps matching rows only.", "LEFT JOIN preserves all rows from the left table.", "Unmatched right-side values appear as NULL."],
    },
    {
        "domain": "SQL", "category": "Database", "description": "SQL queries, relational databases, indexing and transaction concepts.",
        "topic": "Indexes", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "What is a database index, and what trade-offs should you consider before adding one?",
        "sample_answer": "An index is a data structure that helps the database find rows without scanning the entire table. It can improve read queries that filter, join or sort on indexed columns. Indexes consume storage and add work to inserts, updates and deletes, so they should be added based on actual query patterns and measured performance.",
        "key_points": ["Indexes can speed up suitable reads.", "Indexes require storage and slow some writes.", "Use query plans and workload measurements to choose indexes."],
    },
    {
        "domain": "SQL", "category": "Database", "description": "SQL queries, relational databases, indexing and transaction concepts.",
        "topic": "Transactions", "difficulty": "beginner", "estimated_minutes": 4,
        "question_text": "What does ACID mean in the context of database transactions?",
        "sample_answer": "ACID stands for Atomicity, Consistency, Isolation and Durability. Atomicity means a transaction succeeds completely or is rolled back. Consistency means it preserves database rules. Isolation controls how concurrent transactions interact. Durability means committed changes persist according to the database's guarantees.",
        "key_points": ["Atomicity: all or nothing.", "Consistency: preserve valid database state.", "Isolation: manage concurrent transaction effects.", "Durability: committed changes persist."],
    },
    {
        "domain": "Data Structures and Algorithms", "category": "Computer Science", "description": "Data structures, algorithm design and complexity analysis.",
        "topic": "Arrays and Hash Maps", "difficulty": "beginner", "estimated_minutes": 4,
        "question_text": "How would you solve the Two Sum problem efficiently?",
        "sample_answer": "Use a hash map to store values already visited and their indices. For each number, calculate its complement as target minus the current value. If the complement is already in the map, return the stored index and current index. Otherwise, store the current value and index. The expected time complexity is O(n) with O(n) extra space.",
        "key_points": ["Scan the array once.", "Look up the complement in a hash map.", "Expected O(n) time and O(n) extra space."],
    },
    {
        "domain": "Data Structures and Algorithms", "category": "Computer Science", "description": "Data structures, algorithm design and complexity analysis.",
        "topic": "Complexity Analysis", "difficulty": "intermediate", "estimated_minutes": 4,
        "question_text": "What is the difference between O(n), O(log n) and O(n log n) time complexity?",
        "sample_answer": "O(n) grows linearly with input size, as in a single pass through an array. O(log n) grows logarithmically, as in binary search on sorted data where the search space is repeatedly halved. O(n log n) commonly appears in efficient comparison sorting algorithms such as merge sort.",
        "key_points": ["O(n): work grows in proportion to input size.", "O(log n): each step reduces the problem size by a constant factor.", "O(n log n): often combines a logarithmic number of levels with linear work per level."],
    },
]


class Command(BaseCommand):
    help = "Load or update the starter PrepIt Question Bank questions."

    @transaction.atomic
    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for item in QUESTION_DATA:
            domain, _ = InterviewDomain.objects.get_or_create(
                name=item["domain"],
                defaults={
                    "category": item["category"],
                    "description": item["description"],
                    "is_active": True,
                },
            )

            if not domain.is_active:
                domain.is_active = True
                domain.save(update_fields=["is_active"])

            question, created = QuestionBankItem.objects.update_or_create(
                domain=domain,
                topic=item["topic"],
                defaults={
                    "question_text": item["question_text"],
                    "difficulty": item["difficulty"],
                    "sample_answer": item["sample_answer"],
                    "key_points": item["key_points"],
                    "estimated_minutes": item["estimated_minutes"],
                    "is_active": True,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Question Bank seed completed: {created_count} created, "
                f"{updated_count} updated. Total starter questions: {len(QUESTION_DATA)}."
            )
        )
