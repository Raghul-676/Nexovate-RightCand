from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans


class EmbeddingAnalyzer:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def cluster_files(self, analysis, n_clusters=4):
        texts = []

        for file in analysis.get("files", []):
            text = (
                " ".join([f["name"] for f in file.get("functions", [])]) + " " +
                " ".join(file.get("imports", [])) + " " +
                " ".join(file.get("variable_names", []))
            )
            texts.append(text[:500])

        if not texts:
            return {}

        embeddings = self.model.encode(texts)

        kmeans = KMeans(n_clusters=min(n_clusters, len(texts)))
        labels = kmeans.fit_predict(embeddings)

        clusters = {}
        for idx, label in enumerate(labels):
            clusters.setdefault(int(label), []).append(
                analysis["files"][idx]["filename"]
            )

        return clusters