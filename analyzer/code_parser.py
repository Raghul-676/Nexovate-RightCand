import ast
import os
import re
import json
import lizard
from collections import defaultdict
from typing import Dict, List, Any

# Extensions to parse for content signals
CODE_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb',
    '.cpp', '.c', '.cs', '.php', '.rs', '.kt', '.swift', '.html',
    '.css', '.scss', '.vue', '.svelte'
}
CONFIG_FILES = {
    'package.json', 'requirements.txt', 'pom.xml', 'build.gradle',
    'cargo.toml', 'go.mod', 'gemfile', 'composer.json', 'pubspec.yaml',
    'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    '.env.example', 'pyproject.toml', 'setup.py', 'setup.cfg'
}
SKIP_DIRS = {
    '.git', 'node_modules', '__pycache__', '.venv', 'venv',
    'dist', 'build', '.next', '.nuxt', 'coverage', '.cache'
}

class DeepCodeParser:
    def __init__(self):
        self.file_analyses = []

    def analyze_repository(self, repo_path: str) -> Dict[str, Any]:
        analysis = {
            'files': [], 'semantic_patterns': {}, 'architectural_style': None,
            'complexity_metrics': {}, 'domain_signals': {}, 'project_context': {}
        }

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    file_analysis = self._analyze_python_file(filepath)
                    if file_analysis:
                        analysis['files'].append(file_analysis)

        analysis['semantic_patterns'] = self._extract_semantic_patterns(analysis['files'])
        analysis['architectural_style'] = self._detect_architecture(analysis['files'])
        analysis['complexity_metrics'] = self._aggregate_complexity(analysis['files'])
        analysis['domain_signals'] = self._extract_domain_signals(analysis['files'])
        analysis['project_context'] = self._extract_project_context(analysis['files'], repo_path)

        return analysis
    
    def _analyze_python_file(self, filepath: str) -> Dict[str, Any]:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            complexity = lizard.analyze_file(filepath)
            
            return {
                'path': filepath,
                'filename': os.path.basename(filepath),
                'content': content,
                'classes': self._extract_classes(tree),
                'functions': self._extract_functions(tree, content),
                'algorithms': self._detect_algorithms(tree, content),
                'design_patterns': self._detect_patterns(tree),
                'complexity': complexity.average_cyclomatic_complexity,
                'nloc': complexity.nloc,
                'imports': self._extract_imports(tree),
                'business_logic': self._extract_business_logic(content),
                'api_endpoints': self._extract_api_endpoints(tree, content),
                'string_literals': self._extract_string_literals(tree),
                'variable_names': self._extract_variable_names(tree)
            }
        except:
            return None
    
    def _extract_classes(self, tree: ast.AST) -> List[Dict]:
        classes = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                classes.append({
                    'name': node.name,
                    'bases': [self._get_name(base) for base in node.bases],
                    'methods': [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                })
        return classes
    
    def _extract_functions(self, tree: ast.AST, content: str) -> List[Dict]:
        functions = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                docstring = ast.get_docstring(node)
                functions.append({
                    'name': node.name,
                    'args': [arg.arg for arg in node.args.args],
                    'is_async': isinstance(node, ast.AsyncFunctionDef),
                    'docstring': docstring
                })
        return functions
    
    def _detect_algorithms(self, tree: ast.AST, content: str) -> List[str]:
        algorithms = []
        content_lower = content.lower()
        
        if any(kw in content_lower for kw in ['sort', 'quicksort', 'mergesort']):
            algorithms.append('sorting')
        if any(kw in content_lower for kw in ['search', 'binary_search', 'dfs', 'bfs']):
            algorithms.append('search')
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                func_name = self._get_name(node.func).lower()
                if any(ml in func_name for ml in ['fit', 'predict', 'train']):
                    algorithms.append('machine_learning')
                    break
        
        return list(set(algorithms))
    
    def _detect_patterns(self, tree: ast.AST) -> List[str]:
        patterns = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                methods = [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                if 'singleton' in node.name.lower():
                    patterns.append('singleton')
                if 'factory' in node.name.lower():
                    patterns.append('factory')
                if any(m in methods for m in ['subscribe', 'notify', 'update']):
                    patterns.append('observer')
        return patterns
    
    def _extract_imports(self, tree: ast.AST) -> List[str]:
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.extend([alias.name for alias in node.names])
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.append(node.module)
        return imports
    
    def _extract_business_logic(self, content: str) -> Dict[str, bool]:
        content_lower = content.lower()
        return {
            'has_validation': any(kw in content_lower for kw in ['validate', 'check']),
            'has_authentication': any(kw in content_lower for kw in ['auth', 'login', 'token']),
            'has_database_ops': any(kw in content_lower for kw in ['query', 'select', 'insert']),
            'has_api_calls': any(kw in content_lower for kw in ['request', 'response', 'api'])
        }
    
    def _extract_semantic_patterns(self, files: List[Dict]) -> Dict[str, Any]:
        total_classes = sum(len(f.get('classes', [])) for f in files)
        total_functions = sum(len(f.get('functions', [])) for f in files)
        
        return {
            'oop_style': total_classes > total_functions * 0.3,
            'functional_style': total_functions > total_classes * 2,
            'uses_async': any(any(f.get('is_async') for f in file.get('functions', [])) for file in files)
        }
    
    def _detect_architecture(self, files: List[Dict]) -> str:
        paths = [f['path'].lower() for f in files]
        
        if any('controller' in p and 'model' in p for p in paths):
            return 'MVC'
        elif any('service' in p and 'repository' in p for p in paths):
            return 'Layered'
        elif any('lambda' in p for p in paths):
            return 'Serverless'
        return 'Monolithic'
    
    def _aggregate_complexity(self, files: List[Dict]) -> Dict[str, float]:
        complexities = [f.get('complexity', 0) for f in files if f.get('complexity')]
        return {
            'avg_complexity': sum(complexities) / len(complexities) if complexities else 0,
            'max_complexity': max(complexities) if complexities else 0,
            'total_nloc': sum(f.get('nloc', 0) for f in files)
        }
    
    def _extract_domain_signals(self, files: List[Dict]) -> Dict[str, int]:
        signals = defaultdict(int)
        
        for file in files:
            imports = file.get('imports', [])
            if any(lib in str(imports) for lib in ['sklearn', 'tensorflow', 'torch']):
                signals['machine_learning'] += 3
            if any(lib in str(imports) for lib in ['pandas', 'numpy']):
                signals['data_science'] += 2
            if any(lib in str(imports) for lib in ['flask', 'django', 'fastapi']):
                signals['web_development'] += 3
            if file.get('algorithms'):
                signals['algorithms'] += len(file['algorithms'])
        
        return dict(signals)
    
    def _get_name(self, node) -> str:
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        return ''

    def _extract_api_endpoints(self, tree: ast.AST, content: str) -> List[Dict]:
        """Extract API endpoints from decorators"""
        endpoints = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                for decorator in node.decorator_list:
                    decorator_name = self._get_name(decorator)
                    # FastAPI/Flask route decorators
                    if any(x in decorator_name.lower() for x in ['post', 'get', 'put', 'delete', 'route']):
                        # Try to extract path from decorator
                        path = None
                        if isinstance(decorator, ast.Call) and decorator.args:
                            if isinstance(decorator.args[0], ast.Str):
                                path = decorator.args[0].s
                            elif isinstance(decorator.args[0], ast.Constant):
                                path = decorator.args[0].value
                        
                        endpoints.append({
                            'method': decorator_name,
                            'path': path,
                            'function': node.name
                        })
        
        return endpoints
    
    def _extract_string_literals(self, tree: ast.AST) -> List[str]:
        """Extract string literals for context understanding"""
        literals = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Str):
                if len(node.s) > 10 and len(node.s) < 200:  # Meaningful strings
                    literals.append(node.s)
            elif isinstance(node, ast.Constant) and isinstance(node.value, str):
                if len(node.value) > 10 and len(node.value) < 200:
                    literals.append(node.value)
        return literals[:30]
    
    def _extract_variable_names(self, tree: ast.AST) -> List[str]:
        """Extract variable names to understand domain"""
        variables = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        variables.append(target.id)
        return list(set(variables))[:50]
    
    def _extract_project_context(self, files: List[Dict], repo_path: str = None) -> Dict[str, Any]:
        """Extract rich signals from ALL file types for the LLM to analyse"""

        all_imports = []
        all_functions = []
        all_classes = []
        all_endpoints = []
        all_filenames = []
        all_code_content = []
        dependencies = []      # from package.json / requirements.txt etc.
        tech_signals = []      # detected frameworks/libs from non-Python files
        code_patterns = []

        # ── Collect from already-parsed Python files ──────────────────────────
        for file in files:
            all_imports.extend(file.get('imports', []))
            all_filenames.append(file.get('filename', ''))
            all_endpoints.extend(file.get('api_endpoints', []))
            all_code_content.append(file.get('content', ''))
            for func in file.get('functions', []):
                all_functions.append(func['name'])
            for cls in file.get('classes', []):
                all_classes.append(cls['name'])

        # ── Walk repo for ALL other file types ────────────────────────────────
        if repo_path:
            for root, dirs, repo_files in os.walk(repo_path):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                rel_root = os.path.relpath(root, repo_path)

                for fname in repo_files:
                    ext = os.path.splitext(fname)[1].lower()
                    rel_path = os.path.join(rel_root, fname) if rel_root != '.' else fname
                    rel_path = rel_path.replace('\\', '/')
                    all_filenames.append(rel_path)
                    filepath = os.path.join(root, fname)

                    # ── Config / dependency files ──────────────────────────
                    if fname.lower() in CONFIG_FILES:
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                            if fname.lower() == 'package.json':
                                pkg = json.loads(content)
                                deps = list(pkg.get('dependencies', {}).keys()) + \
                                       list(pkg.get('devDependencies', {}).keys())
                                dependencies.extend(deps[:40])
                                # detect framework from package.json
                                dep_str = ' '.join(deps).lower()
                                if 'react' in dep_str: tech_signals.append('React')
                                if 'vue' in dep_str: tech_signals.append('Vue.js')
                                if 'angular' in dep_str: tech_signals.append('Angular')
                                if 'next' in dep_str: tech_signals.append('Next.js')
                                if 'nuxt' in dep_str: tech_signals.append('Nuxt.js')
                                if 'svelte' in dep_str: tech_signals.append('Svelte')
                                if 'express' in dep_str: tech_signals.append('Express.js')
                                if 'nestjs' in dep_str or '@nestjs' in dep_str: tech_signals.append('NestJS')
                                if 'tailwindcss' in dep_str: tech_signals.append('Tailwind CSS')
                                if 'typescript' in dep_str: tech_signals.append('TypeScript')
                                if 'mongoose' in dep_str: tech_signals.append('MongoDB/Mongoose')
                                if 'prisma' in dep_str: tech_signals.append('Prisma ORM')
                                if 'sequelize' in dep_str: tech_signals.append('Sequelize ORM')
                                if 'socket.io' in dep_str: tech_signals.append('Socket.IO')
                                if 'redux' in dep_str: tech_signals.append('Redux')
                                if 'graphql' in dep_str: tech_signals.append('GraphQL')
                                if 'jest' in dep_str or 'vitest' in dep_str: tech_signals.append('Testing (Jest/Vitest)')
                                if 'electron' in dep_str: tech_signals.append('Electron (Desktop App)')
                                if 'react-native' in dep_str: tech_signals.append('React Native (Mobile)')
                                if 'expo' in dep_str: tech_signals.append('Expo (Mobile)')
                            elif fname.lower() == 'requirements.txt':
                                dependencies.extend([l.split('==')[0].split('>=')[0].strip()
                                                     for l in content.splitlines() if l.strip() and not l.startswith('#')][:30])
                            elif fname.lower() in ('pom.xml', 'build.gradle'):
                                tech_signals.append('Java/JVM project')
                                if 'spring' in content.lower(): tech_signals.append('Spring Boot')
                                if 'android' in content.lower(): tech_signals.append('Android')
                            elif fname.lower() == 'go.mod':
                                tech_signals.append('Go project')
                                if 'gin' in content.lower(): tech_signals.append('Gin framework')
                                if 'fiber' in content.lower(): tech_signals.append('Fiber framework')
                            elif fname.lower() == 'cargo.toml':
                                tech_signals.append('Rust project')
                            elif fname.lower() == 'pubspec.yaml':
                                tech_signals.append('Flutter/Dart project')
                            elif fname.lower() in ('dockerfile', 'docker-compose.yml', 'docker-compose.yaml'):
                                tech_signals.append('Dockerized application')
                        except Exception:
                            pass

                    # ── JS / TS source files ───────────────────────────────
                    elif ext in ('.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte') and len(all_code_content) < 20:
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read(2000)  # first 2KB only
                            content_lower = content.lower()
                            # extract import lines
                            for line in content.splitlines():
                                line = line.strip()
                                if line.startswith('import ') or line.startswith('from '):
                                    all_imports.append(line[:80])
                                if 'function ' in line or '=>' in line:
                                    m = re.search(r'function\s+(\w+)', line)
                                    if m: all_functions.append(m.group(1))
                            # detect patterns
                            if 'usestate' in content_lower or 'useeffect' in content_lower:
                                tech_signals.append('React hooks')
                            if 'router' in content_lower and ('get(' in content_lower or 'post(' in content_lower):
                                tech_signals.append('REST API routes')
                            if 'mongoose.model' in content_lower or 'schema(' in content_lower:
                                tech_signals.append('MongoDB schema')
                            if 'sequelize' in content_lower:
                                tech_signals.append('SQL ORM')
                            if 'socket' in content_lower and 'emit' in content_lower:
                                tech_signals.append('WebSocket/real-time')
                            all_code_content.append(content)
                        except Exception:
                            pass

                    # ── HTML files ────────────────────────────────────────
                    elif ext == '.html' and len(all_code_content) < 25:
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read(2000)
                            content_lower = content.lower()
                            if 'react' in content_lower or 'jsx' in content_lower:
                                tech_signals.append('React frontend')
                            if 'vue' in content_lower:
                                tech_signals.append('Vue frontend')
                            if 'bootstrap' in content_lower:
                                tech_signals.append('Bootstrap CSS')
                            if 'tailwind' in content_lower:
                                tech_signals.append('Tailwind CSS')
                            if '<form' in content_lower:
                                tech_signals.append('HTML forms')
                            if 'chart' in content_lower or 'graph' in content_lower:
                                tech_signals.append('Data visualization')
                            all_code_content.append(content)
                        except Exception:
                            pass

                    # ── Java files ────────────────────────────────────────
                    elif ext == '.java' and len(all_code_content) < 20:
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read(2000)
                            content_lower = content.lower()
                            for line in content.splitlines():
                                if line.strip().startswith('import '):
                                    all_imports.append(line.strip()[:80])
                            if '@restcontroller' in content_lower or '@controller' in content_lower:
                                tech_signals.append('Spring MVC Controller')
                            if '@entity' in content_lower:
                                tech_signals.append('JPA Entity (Database model)')
                            if '@service' in content_lower:
                                tech_signals.append('Spring Service layer')
                            if 'android' in content_lower or 'activity' in content_lower:
                                tech_signals.append('Android Activity')
                            all_code_content.append(content)
                        except Exception:
                            pass

        # ── Code patterns from all collected content ──────────────────────────
        full_code = '\n'.join(all_code_content).lower()
        if 'pickle.load' in full_code or 'joblib.load' in full_code:
            code_patterns.append('Model serialization/deserialization')
        if 'scaler.transform' in full_code or 'imputer.transform' in full_code:
            code_patterns.append('Feature preprocessing pipeline')
        if '@app.route' in full_code or '@router' in full_code or 'app.get(' in full_code:
            code_patterns.append('RESTful API endpoints')
        if 'async def' in full_code or 'async function' in full_code or 'await ' in full_code:
            code_patterns.append('Asynchronous programming')
        if ('try:' in full_code and 'except' in full_code) or 'try {' in full_code:
            code_patterns.append('Error handling')
        if 'jwt' in full_code or 'bearer' in full_code or 'bcrypt' in full_code:
            code_patterns.append('Authentication/JWT')
        if 'select ' in full_code or 'insert into' in full_code or '.query(' in full_code:
            code_patterns.append('Database queries')

        # deduplicate
        all_filenames = list(dict.fromkeys(all_filenames))[:150]
        tech_signals = list(dict.fromkeys(tech_signals))
        dependencies = list(dict.fromkeys(dependencies))[:50]

        return {
            'imports': list(set(all_imports))[:60],
            'function_names': all_functions[:60],
            'class_names': all_classes[:40],
            'filenames': all_filenames,
            'api_endpoints': [{'method': ep.get('method'), 'path': ep.get('path')} for ep in all_endpoints],
            'code_patterns': code_patterns,
            'dependencies': dependencies,
            'tech_signals': tech_signals,
        }
