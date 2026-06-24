# GitHub Repository Analyzer - ML-Based Deep Code Analysis

An intelligent system that performs deep semantic analysis of GitHub repositories using ML-based classification, going far beyond simple pattern matching.

## How It Works

### 1. Deep Code Parsing
- **AST Analysis**: Parses Abstract Syntax Trees to understand code structure semantically
- **Algorithm Detection**: Identifies sorting, searching, ML algorithms by analyzing logic flow
- **Design Pattern Recognition**: Detects Singleton, Factory, Observer patterns
- **Business Logic Extraction**: Identifies authentication, validation, database operations

### 2. ML-Based Classification
- **Semantic Embeddings**: Uses sentence transformers for code understanding
- **Domain Classification**: Classifies into web dev, ML, data science, algorithms, etc.
- **Confidence Scoring**: Provides confidence levels for classifications
- **Multi-label Support**: Identifies primary and secondary domains

### 3. Complexity Assessment
- **Cyclomatic Complexity**: Measures code complexity using Lizard
- **Architectural Analysis**: Detects MVC, Layered, Microservices patterns
- **Sophistication Scoring**: Evaluates beginner/intermediate/advanced level
- **Reasoning**: Provides detailed reasons for complexity assessment

### 4. Intelligent README Generation
- Creates comprehensive documentation based on actual code analysis
- Includes technical stack, architecture, complexity metrics
- Highlights key features discovered through semantic analysis

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```python
from main import GitHubAnalyzer

analyzer = GitHubAnalyzer()
result = analyzer.analyze_github_repo("https://github.com/user/repo")

print(f"Project: {result['project_name']}")
print(f"Domain: {result['domain']}")
print(f"Complexity: {result['complexity_level']}")
```

Or run directly:
```bash
python main.py
```

## Key Differentiators

Unlike simple analyzers that only check imports and function names, this system:

1. **Analyzes Code Logic**: Understands what the code actually does
2. **Detects Algorithms**: Identifies algorithmic patterns in implementation
3. **Understands Architecture**: Recognizes architectural patterns from structure
4. **Semantic Analysis**: Uses ML embeddings for deep understanding
5. **Context-Aware**: Considers relationships between modules
6. **Complexity Scoring**: Multi-dimensional complexity assessment

## Example Output

```
Project Name: ML-Classifier
Domain: machine_learning (confidence: 87%)
Complexity Level: Advanced

Reasons:
- High cyclomatic complexity (12.3)
- Large codebase (8500 lines)
- Uses 7 design patterns
- Complex architecture: Layered
- Uses async programming
- Implements 9 algorithms
```

## Architecture

```
github-analyzer/
├── analyzer/
│   ├── code_parser.py       # Deep semantic code analysis
│   ├── ml_classifier.py     # ML-based domain classification
│   └── readme_generator.py  # Intelligent README creation
├── main.py                  # Entry point
└── requirements.txt
```

## Technologies

- **AST Parsing**: Python ast module for syntax tree analysis
- **Complexity Analysis**: Lizard for cyclomatic complexity
- **ML Classification**: Sentence Transformers for semantic understanding
- **Git Integration**: GitPython for repository cloning

## Future Enhancements

- Support for JavaScript, Java, C++, Go
- Graph neural networks for code understanding
- Vulnerability detection
- Code quality scoring
- Dependency analysis
- Performance bottleneck detection
