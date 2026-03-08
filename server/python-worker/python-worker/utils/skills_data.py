"""
Predefined skills database for resume skill extraction.
Contains technical and soft skills across multiple categories.
"""

# Comprehensive list of skills to detect in resumes
SKILLS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "csharp",
    "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala",
    "r", "perl", "shell", "bash", "powershell", "sql", "html", "css",
    "dart", "objective-c", "lua", "haskell", "elixir", "clojure",
    
    # Frontend Frameworks & Libraries
    "react", "reactjs", "react.js", "vue", "vuejs", "vue.js", "angular",
    "angularjs", "svelte", "next.js", "nextjs", "nuxt", "gatsby",
    "jquery", "bootstrap", "tailwind", "tailwindcss", "material-ui",
    "sass", "scss", "less", "webpack", "vite", "redux", "mobx",
    
    # Backend Frameworks
    "node.js", "nodejs", "express", "expressjs", "django", "flask",
    "fastapi", "spring", "spring boot", "springboot", ".net", "dotnet",
    "asp.net", "laravel", "symfony", "rails", "ruby on rails",
    "nestjs", "koa", "hapi", "gin", "echo", "actix",
    
    # Mobile Development
    "react native", "flutter", "android", "ios", "xamarin", "ionic",
    "cordova", "swiftui",
    
    # Databases
    "mongodb", "mysql", "postgresql", "postgres", "sql server", "oracle",
    "sqlite", "redis", "cassandra", "dynamodb", "elasticsearch",
    "mariadb", "couchdb", "neo4j", "firebase", "firestore",
    "realm", "supabase",
    
    # Cloud Platforms
    "aws", "amazon web services", "azure", "microsoft azure", "gcp",
    "google cloud", "google cloud platform", "heroku", "digitalocean",
    "linode", "cloudflare", "vercel", "netlify",
    
    # Cloud Services (AWS)
    "ec2", "s3", "lambda", "rds", "dynamodb", "cloudfront", "route53",
    "iam", "vpc", "cloudwatch", "sns", "sqs", "api gateway",
    
    # Cloud Services (Azure)
    "azure functions", "azure storage", "azure sql", "cosmos db",
    "azure devops",
    
    # Cloud Services (GCP)
    "compute engine", "cloud storage", "cloud functions", "bigquery",
    "cloud sql", "app engine",
    
    # DevOps & CI/CD
    "docker", "kubernetes", "k8s", "jenkins", "gitlab", "github actions",
    "circleci", "travis ci", "ansible", "terraform", "puppet", "chef",
    "vagrant", "helm", "argocd", "prometheus", "grafana", "nagios",
    "ci/cd", "continuous integration", "continuous deployment",
    
    # Version Control
    "git", "github", "gitlab", "bitbucket", "svn", "mercurial",
    
    # Data Science & ML
    "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
    "scikit-learn", "sklearn", "tensorflow", "keras", "pytorch",
    "xgboost", "lightgbm", "catboost", "opencv", "nltk", "spacy",
    "hugging face", "transformers", "bert", "gpt",
    
    # Data Engineering
    "apache spark", "hadoop", "kafka", "airflow", "luigi", "dbt",
    "snowflake", "databricks", "redshift", "bigquery",
    
    # Testing
    "jest", "mocha", "chai", "pytest", "unittest", "selenium",
    "cypress", "playwright", "junit", "testng", "rspec",
    "jasmine", "karma",
    
    # API & Web Technologies
    "rest", "restful", "rest api", "graphql", "grpc", "soap",
    "websocket", "webhooks", "oauth", "jwt", "json", "xml",
    "microservices", "api design",
    
    # Monitoring & Logging
    "elk", "elasticsearch", "logstash", "kibana", "splunk",
    "datadog", "new relic", "sentry",
    
    # Message Queues
    "rabbitmq", "kafka", "redis", "celery", "activemq", "zeromq",
    
    # Web Servers
    "nginx", "apache", "tomcat", "iis", "gunicorn", "uvicorn",
    
    # Operating Systems
    "linux", "unix", "windows", "macos", "ubuntu", "centos",
    "debian", "redhat", "fedora",
    
    # Methodologies & Practices
    "agile", "scrum", "kanban", "devops", "tdd", "bdd",
    "test driven development", "behavior driven development",
    "pair programming", "code review", "ci/cd",
    
    # Design & Architecture
    "system design", "software architecture", "design patterns",
    "oop", "object oriented programming", "functional programming",
    "mvc", "mvvm", "clean architecture", "solid principles",
    "domain driven design", "ddd",
    
    # Security
    "security", "cybersecurity", "penetration testing", "owasp",
    "ssl", "tls", "encryption", "authentication", "authorization",
    "firewall", "vpn",
    
    # Soft Skills
    "communication", "leadership", "teamwork", "team collaboration",
    "problem solving", "critical thinking", "time management",
    "project management", "mentoring", "presentation",
    "analytical skills", "attention to detail", "creative thinking",
    "adaptability", "flexibility", "self-motivated",
    
    # Project Management & Tools
    "jira", "confluence", "trello", "asana", "slack", "notion",
    "monday.com", "microsoft teams", "zoom",
    
    # Other Tools & Technologies
    "postman", "insomnia", "swagger", "figma", "sketch",
    "adobe xd", "photoshop", "illustrator", "vs code",
    "visual studio", "intellij", "pycharm", "eclipse",
    "vim", "emacs",
    
    # Blockchain & Web3
    "blockchain", "ethereum", "solidity", "smart contracts",
    "web3", "nft", "defi",
    
    # Game Development
    "unity", "unreal engine", "godot", "game development",
    
    # Data Formats
    "json", "xml", "yaml", "csv", "parquet", "avro",
    
    # Business & Analytics
    "tableau", "power bi", "looker", "excel", "google analytics",
    "mixpanel", "amplitude",
    
    # E-commerce & CMS
    "shopify", "wordpress", "woocommerce", "magento", "drupal",
    "contentful", "strapi",
]

# Convert all skills to lowercase for case-insensitive matching
SKILLS = [skill.lower() for skill in SKILLS]

# Remove duplicates while preserving order
SKILLS = list(dict.fromkeys(SKILLS))


def get_all_skills():
    """
    Get the complete list of predefined skills.
    
    Returns:
        list: List of all skill keywords
    """
    return SKILLS.copy()


def get_skills_count():
    """
    Get the total number of skills in the database.
    
    Returns:
        int: Number of skills
    """
    return len(SKILLS)
