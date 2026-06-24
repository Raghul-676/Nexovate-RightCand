# import os
# import sys
# from git import Repo
# from analyzer.code_parser import DeepCodeParser
# from analyzer.ml_classifier import MLDomainClassifier
# from analyzer.readme_generator import ReadmeGenerator

# class GitHubAnalyzer:
#     def __init__(self):
#         self.parser = DeepCodeParser()
#         self.classifier = MLDomainClassifier()
#         self.readme_gen = ReadmeGenerator()
    
#     def analyze_github_repo(self, github_url: str, clone_path: str = './temp_repo'):
#         print(f"Cloning repository from {github_url}...")
        
#         if os.path.exists(clone_path):
#             import shutil
#             shutil.rmtree(clone_path, ignore_errors=True)
        
#         Repo.clone_from(github_url, clone_path)
#         print("Repository cloned successfully!\n")
        
#         print("Performing deep code analysis...")
#         analysis = self.parser.analyze_repository(clone_path)
#         print(f"Analyzed {len(analysis['files'])} files\n")
        
#         print("Classifying domains using advanced ML analysis...")
#         domains, summary = self.classifier.classify_domain(analysis)
        
#         print("\n📊 DOMAIN BREAKDOWN:")
#         for domain, percentage in domains:
#             print(f"  {domain.replace('_', ' ').title()}: {percentage*100:.1f}%")
        
#         print(f"\n📝 PROJECT SUMMARY:")
#         print(f"  {summary}\n")
        
#         print("Assessing complexity level...")
#         complexity_level, complexity_details = self.classifier.assess_complexity_level(analysis)
#         print(f"Complexity Level: {complexity_level}")
#         print(f"Complexity Score: {complexity_details['score']}\n")
        
#         print("Generating project name...")
#         project_name = self.classifier.generate_project_name(analysis, domains)
#         print(f"Suggested Project Name: {project_name}\n")
        
#         print("Generating comprehensive README...")
#         readme_content = self.readme_gen.generate_readme(
#             analysis, project_name, domains, summary, complexity_level, complexity_details
#         )
        
#         readme_path = os.path.join(clone_path, 'ANALYSIS_README.md')
#         with open(readme_path, 'w', encoding='utf-8') as f:
#             f.write(readme_content)
        
#         print(f"README generated at: {readme_path}\n")
        
#         return {
#             'project_name': project_name,
#             'domains': domains,
#             'summary': summary,
#             'complexity_level': complexity_level,
#             'analysis': analysis,
#             'readme_path': readme_path
#         }

# if __name__ == "__main__":
#     analyzer = GitHubAnalyzer()
    
#     github_url = input("Enter GitHub repository URL: ")
    
#     result = analyzer.analyze_github_repo(github_url)
    
#     print("\n" + "="*60)
#     print("✅ ANALYSIS COMPLETE")
#     print("="*60)
#     print(f"Project Name: {result['project_name']}")
#     print(f"Summary: {result['summary']}")
#     print(f"\nDomain Breakdown:")
#     for domain, pct in result['domains']:
#         print(f"  - {domain.replace('_', ' ').title()}: {pct*100:.1f}%")
#     print(f"\nComplexity: {result['complexity_level']}")
#     print(f"README: {result['readme_path']}")


# import os
# import sys
# from git import Repo
# from analyzer.code_parser import DeepCodeParser
# from analyzer.ml_classifier import MLDomainClassifier
# from analyzer.readme_generator import ReadmeGenerator


# def get_available_folder(base_name="./temp_repo"):
#     """
#     Create a new folder name if base folder exists.
#     temp_repo -> temp_repo_1 -> temp_repo_2 -> ...
#     """
#     if not os.path.exists(base_name):
#         return base_name

#     i = 1
#     while True:
#         new_name = f"{base_name}_{i}"
#         if not os.path.exists(new_name):
#             return new_name
#         i += 1


# class GitHubAnalyzer:
#     def __init__(self):
#         self.parser = DeepCodeParser()
#         self.classifier = MLDomainClassifier()
#         self.readme_gen = ReadmeGenerator()

#     def analyze_github_repo(self, github_url: str):
#         clone_path = get_available_folder("./temp_repo")

#         print(f"Cloning repository from {github_url}...")
#         print(f"Using folder: {clone_path}\n")

#         Repo.clone_from(github_url, clone_path)
#         print("Repository cloned successfully!\n")

#         print("Performing deep code analysis...")
#         analysis = self.parser.analyze_repository(clone_path)
#         print(f"Analyzed {len(analysis['files'])} files\n")

#         print("Classifying domains using advanced ML analysis...")
#         domains, summary = self.classifier.classify_domain(analysis)

#         print("\n📊 DOMAIN BREAKDOWN:")
#         for domain, percentage in domains:
#             print(f"  {domain.replace('_', ' ').title()}: {percentage*100:.1f}%")

#         print(f"\n📝 PROJECT SUMMARY:")
#         print(f"  {summary}\n")

#         print("Assessing complexity level...")
#         complexity_level, complexity_details = self.classifier.assess_complexity_level(analysis)
#         print(f"Complexity Level: {complexity_level}")
#         print(f"Complexity Score: {complexity_details['score']}\n")

#         print("Generating project name...")
#         project_name = self.classifier.generate_project_name(analysis, domains)
#         print(f"Suggested Project Name: {project_name}\n")

#         print("Generating comprehensive README...")
#         readme_content = self.readme_gen.generate_readme(
#             analysis,
#             project_name,
#             domains,
#             summary,
#             complexity_level,
#             complexity_details
#         )

#         readme_path = os.path.join(clone_path, 'ANALYSIS_README.md')
#         with open(readme_path, 'w', encoding='utf-8') as f:
#             f.write(readme_content)

#         print(f"README generated at: {readme_path}\n")

#         return {
#             'project_name': project_name,
#             'domains': domains,
#             'summary': summary,
#             'complexity_level': complexity_level,
#             'analysis': analysis,
#             'readme_path': readme_path,
#             'clone_path': clone_path
#         }


# if __name__ == "__main__":
#     analyzer = GitHubAnalyzer()

#     github_url = input("Enter GitHub repository URL: ")

#     result = analyzer.analyze_github_repo(github_url)

#     print("\n" + "=" * 60)
#     print("✅ ANALYSIS COMPLETE")
#     print("=" * 60)
#     print(f"Project Name: {result['project_name']}")
#     print(f"Summary: {result['summary']}")

#     print("\nDomain Breakdown:")
#     for domain, pct in result['domains']:
#         print(f"  - {domain.replace('_', ' ').title()}: {pct*100:.1f}%")

#     print(f"\nComplexity: {result['complexity_level']}")
#     print(f"README: {result['readme_path']}")
#     print(f"Cloned Repo Folder: {result['clone_path']}")


import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

from git import Repo

from analyzer.code_parser import DeepCodeParser
from analyzer.ml_classifier import MLDomainClassifier
from analyzer.readme_generator import ReadmeGenerator
from analyzer.embedding_analyser import EmbeddingAnalyzer


def get_available_folder(base_name="./temp_repo"):
    if not os.path.exists(base_name):
        return base_name

    i = 1
    while True:
        name = f"{base_name}_{i}"
        if not os.path.exists(name):
            return name
        i += 1


class GitHubAnalyzer:
    def __init__(self):
        self.parser = DeepCodeParser()
        self.embedder = EmbeddingAnalyzer()
        self.classifier = MLDomainClassifier()
        self.readme_gen = ReadmeGenerator()

    def analyze_github_repo(self, github_url: str):
        clone_path = get_available_folder()

        print("Cloning repo...")
        Repo.clone_from(github_url, clone_path)

        print("Parsing code...")
        analysis = self.parser.analyze_repository(clone_path)

        print("Generating embeddings...")
        clusters = self.embedder.cluster_files(analysis)

        print("LLM classification...")
        domains, summary = self.classifier.classify_domain(analysis, clusters)

        print("Assessing complexity...")
        complexity, details = self.classifier.assess_complexity_level(analysis)

        print("Generating project name...")
        project_name = self.classifier.generate_project_name(summary)

        print("Generating README...")
        readme = self.readme_gen.generate_readme(
            analysis, project_name, domains, summary, complexity
        )

        readme_path = os.path.join(clone_path, "AI_README.md")
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(readme)

        return {
            "project_name": project_name,
            "domains": domains,
            "summary": summary,
            "complexity": complexity,
            "readme": readme_path
        }


if __name__ == "__main__":
    url = input("Enter GitHub URL: ")
    analyzer = GitHubAnalyzer()
    result = analyzer.analyze_github_repo(url)

    print("\n✅ DONE")
    print(result)