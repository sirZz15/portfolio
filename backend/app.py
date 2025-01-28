import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain_openai import ChatOpenAI

# Flask App Initialization
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
load_dotenv()  # Load environment variables from .env

# Configure Logging
logging.basicConfig(level=logging.INFO)

# Load OpenAI API Key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")

# Path to Documents
documents_path = "./assets"
pdf_files = [os.path.join(documents_path, file) for file in os.listdir(documents_path) if file.endswith(".pdf")]

# Load and Process Documents
documents = []
for file in pdf_files:
    try:
        loader = PyPDFLoader(file)
        documents.extend(loader.load())
        logging.info(f"Loaded file: {file}")
    except Exception as e:
        logging.error(f"Error loading file {file}: {e}")

# Split Text for Vectorization
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\n", "\n", " ", ""]
)
split_documents = text_splitter.split_documents(documents)

# Create Embeddings and Vector Store
embeddings = OpenAIEmbeddings(openai_api_key=api_key)
vector_store = FAISS.from_documents(split_documents, embeddings)

# Load Conversational Retrieval Chain
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=ChatOpenAI(model = "gpt-4o-mini",temperature=0.2,
    openai_api_key=api_key),
    retriever=vector_store.as_retriever()
)

# Chat Endpoint
@app.route("/chat", methods=["POST"])
def chat():
    user_query = request.json.get("query")
    chat_history = request.json.get("chat_history", [])

    if not user_query:
        logging.error("No query provided.")
        return jsonify({"error": "No query provided"}), 400

    try:
        # Use the ConversationalRetrievalChain to get a response
        result = qa_chain({"question": user_query, "chat_history": chat_history})

        # Extract answer and update chat history
        answer = result.get("answer", "Sorry, I couldn't find an answer.")
        chat_history.append({"user": user_query, "ai": answer})

        return jsonify({"response": answer, "chat_history": chat_history})
    except Exception as e:
        logging.error(f"Error processing query: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


# Reset Memory (Optional)
@app.route("/reset", methods=["POST"])
def reset_memory():
    # If additional state needs resetting, add logic here
    return jsonify({"message": "Memory reset successfully"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
