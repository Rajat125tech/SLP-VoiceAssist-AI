#!/usr/bin/env python3
"""
train_model.py - VoiceAssist AI Intent Classification Model Training
Deep Learning Architecture: Embedding -> Bidirectional LSTM -> Dropout -> Dense -> Dropout -> Dense (Softmax)
Evaluates model on validation/test split and exports plots and metrics to results/
"""

import os
import json
import pickle
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for headless plotting
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Bidirectional, LSTM, Dense, Dropout, Input
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "intents.json")
MODEL_DIR = os.path.join(BASE_DIR, "model")
RESULTS_DIR = os.path.join(os.path.dirname(BASE_DIR), "results")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

def load_data(file_path):
    """Load and parse intents JSON dataset."""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    texts = []
    labels = []
    
    for intent_obj in data["intents"]:
        tag = intent_obj["intent"]
        for pattern in intent_obj["patterns"]:
            texts.append(pattern)
            labels.append(tag)
            
    print(f"[Dataset] Total samples: {len(texts)}")
    print(f"[Dataset] Total unique intents: {len(set(labels))}")
    return texts, labels, data

def build_model(vocab_size, embedding_dim, max_length, num_classes):
    """
    Constructs the Bidirectional LSTM neural network architecture.
    Pipeline: Input -> Embedding -> BiLSTM -> Dropout -> Dense -> Dropout -> Dense (Softmax)
    """
    model = Sequential([
        Input(shape=(max_length,), dtype=tf.int32, name="input_sequence"),
        Embedding(
            input_dim=vocab_size,
            output_dim=embedding_dim,
            name="embedding_layer"
        ),
        Bidirectional(
            LSTM(64, return_sequences=False, dropout=0.2, recurrent_dropout=0.2),
            name="bidirectional_lstm"
        ),
        Dropout(0.4, name="dropout_1"),
        Dense(64, activation="relu", name="dense_hidden"),
        Dropout(0.3, name="dropout_2"),
        Dense(num_classes, activation="softmax", name="output_softmax")
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def plot_training_curves(history, results_dir):
    """Generates and saves accuracy and loss curves over epochs."""
    epochs = range(1, len(history.history["accuracy"]) + 1)
    
    # 1. Accuracy Plot
    plt.figure(figsize=(8, 5))
    plt.plot(epochs, history.history["accuracy"], label="Training Accuracy", color="#3b82f6", linewidth=2.5, marker="o")
    plt.plot(epochs, history.history["val_accuracy"], label="Validation Accuracy", color="#10b981", linewidth=2.5, marker="s")
    plt.title("VoiceAssist AI - Model Accuracy vs Epochs", fontsize=14, fontweight="bold", pad=12)
    plt.xlabel("Epochs", fontsize=12)
    plt.ylabel("Accuracy", fontsize=12)
    plt.ylim([0.0, 1.05])
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(loc="lower right", frameon=True)
    plt.tight_layout()
    accuracy_path = os.path.join(results_dir, "accuracy.png")
    plt.savefig(accuracy_path, dpi=300)
    plt.close()
    print(f"[Results] Saved accuracy plot to {accuracy_path}")

    # 2. Loss Plot
    plt.figure(figsize=(8, 5))
    plt.plot(epochs, history.history["loss"], label="Training Loss", color="#ef4444", linewidth=2.5, marker="o")
    plt.plot(epochs, history.history["val_loss"], label="Validation Loss", color="#f59e0b", linewidth=2.5, marker="s")
    plt.title("VoiceAssist AI - Model Loss vs Epochs", fontsize=14, fontweight="bold", pad=12)
    plt.xlabel("Epochs", fontsize=12)
    plt.ylabel("Loss (Sparse Categorical Crossentropy)", fontsize=12)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(loc="upper right", frameon=True)
    plt.tight_layout()
    loss_path = os.path.join(results_dir, "loss.png")
    plt.savefig(loss_path, dpi=300)
    plt.close()
    print(f"[Results] Saved loss plot to {loss_path}")

def plot_confusion_matrix(y_true, y_pred, labels, results_dir):
    """Generates and saves the intent classification confusion matrix."""
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(14, 11))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=labels,
        yticklabels=labels,
        cbar=True,
        linewidths=0.5,
        linecolor="#e2e8f0"
    )
    plt.title("VoiceAssist AI - Intent Classification Confusion Matrix", fontsize=15, fontweight="bold", pad=14)
    plt.xlabel("Predicted Intent", fontsize=13, labelpad=10)
    plt.ylabel("Ground Truth Intent", fontsize=13, labelpad=10)
    plt.xticks(rotation=45, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    cm_path = os.path.join(results_dir, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"[Results] Saved confusion matrix to {cm_path}")

def train_and_evaluate():
    print("=" * 65)
    print("VoiceAssist AI - Deep Learning Model Training Pipeline")
    print("=" * 65)
    
    # 1. Load Dataset
    texts, labels, raw_data = load_data(DATASET_PATH)
    
    # 2. Encode Labels
    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(labels)
    class_names = list(label_encoder.classes_)
    num_classes = len(class_names)
    print(f"[Data] Encoded {num_classes} classes: {class_names[:5]}...")

    # 3. Train/Validation Split (Stratified)
    X_train_text, X_val_text, y_train, y_val = train_test_split(
        texts,
        encoded_labels,
        test_size=0.20,
        random_state=42,
        stratify=encoded_labels
    )
    print(f"[Data] Training samples: {len(X_train_text)}, Validation samples: {len(X_val_text)}")

    # 4. Tokenization and Vectorization
    vocab_size = 1200
    embedding_dim = 64
    max_length = 20
    trunc_type = "post"
    padding_type = "pre"
    oov_tok = "<OOV>"

    tokenizer = Tokenizer(num_words=vocab_size, oov_token=oov_tok, lower=True)
    tokenizer.fit_on_texts(texts)
    
    # Convert text to padded sequences
    train_sequences = tokenizer.texts_to_sequences(X_train_text)
    train_padded = pad_sequences(train_sequences, maxlen=max_length, padding=padding_type, truncating=trunc_type)

    val_sequences = tokenizer.texts_to_sequences(X_val_text)
    val_padded = pad_sequences(val_sequences, maxlen=max_length, padding=padding_type, truncating=trunc_type)

    actual_vocab_size = len(tokenizer.word_index) + 1
    effective_vocab_size = min(vocab_size, actual_vocab_size)
    print(f"[Tokenizer] Vocabulary size: {actual_vocab_size}, Effective vocab: {effective_vocab_size}, Max length: {max_length}")

    # 5. Build Neural Network Architecture
    model = build_model(
        vocab_size=effective_vocab_size + 1,
        embedding_dim=embedding_dim,
        max_length=max_length,
        num_classes=num_classes
    )
    model.summary()

    # 6. Callbacks
    early_stopping = EarlyStopping(
        monitor="val_accuracy",
        patience=25,
        restore_best_weights=True,
        verbose=1
    )
    lr_reduction = ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.6,
        patience=8,
        min_lr=1e-5,
        verbose=1
    )

    # 7. Model Training
    epochs = 80
    batch_size = 8
    print(f"\n[Training] Starting model training for {epochs} epochs with batch size {batch_size}...")
    
    history = model.fit(
        train_padded,
        y_train,
        validation_data=(val_padded, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[early_stopping, lr_reduction],
        verbose=1
    )

    # 8. Evaluation
    val_loss, val_acc = model.evaluate(val_padded, y_val, verbose=0)
    train_loss, train_acc = model.evaluate(train_padded, y_train, verbose=0)
    
    print("\n" + "=" * 65)
    print(f"TRAINING RESULTS:")
    print(f"  Training Accuracy:   {train_acc * 100:.2f}% | Loss: {train_loss:.4f}")
    print(f"  Validation Accuracy: {val_acc * 100:.2f}% | Loss: {val_loss:.4f}")
    print("=" * 65)

    # Predictions & Detailed Classification Metrics
    y_pred_probs = model.predict(val_padded)
    y_pred = np.argmax(y_pred_probs, axis=1)

    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_val, y_pred, average="macro", zero_division=0
    )
    precision_weighted, recall_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_val, y_pred, average="weighted", zero_division=0
    )
    cls_report = classification_report(
        y_val, y_pred, target_names=class_names, zero_division=0
    )

    print("\nCLASSIFICATION REPORT:")
    print(cls_report)

    # 9. Save Plots
    plot_training_curves(history, RESULTS_DIR)
    plot_confusion_matrix(y_val, y_pred, class_names, RESULTS_DIR)

    # 10. Save Metrics File
    metrics_file = os.path.join(RESULTS_DIR, "metrics.txt")
    with open(metrics_file, "w", encoding="utf-8") as f:
        f.write("=" * 70 + "\n")
        f.write("VOICEASSIST AI - MODEL EVALUATION METRICS REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Total Dataset Utterances:   {len(texts)}\n")
        f.write(f"Number of Intents/Classes:  {num_classes}\n")
        f.write(f"Training Samples (80%):     {len(X_train_text)}\n")
        f.write(f"Validation Samples (20%):   {len(X_val_text)}\n")
        f.write(f"Vocabulary Size:            {actual_vocab_size}\n")
        f.write(f"Maximum Sequence Length:    {max_length}\n\n")
        f.write("-" * 70 + "\n")
        f.write("PERFORMANCE SUMMARY:\n")
        f.write("-" * 70 + "\n")
        f.write(f"Training Accuracy:          {train_acc * 100:.2f}%\n")
        f.write(f"Training Loss:              {train_loss:.4f}\n")
        f.write(f"Validation Accuracy:        {val_acc * 100:.2f}%\n")
        f.write(f"Validation Loss:            {val_loss:.4f}\n")
        f.write(f"Macro Precision:            {precision_macro * 100:.2f}%\n")
        f.write(f"Macro Recall:               {recall_macro * 100:.2f}%\n")
        f.write(f"Macro F1-Score:             {f1_macro * 100:.2f}%\n")
        f.write(f"Weighted Precision:         {precision_weighted * 100:.2f}%\n")
        f.write(f"Weighted Recall:            {recall_weighted * 100:.2f}%\n")
        f.write(f"Weighted F1-Score:          {f1_weighted * 100:.2f}%\n\n")
        f.write("-" * 70 + "\n")
        f.write("DETAILED INTENT CLASSIFICATION REPORT:\n")
        f.write("-" * 70 + "\n")
        f.write(cls_report + "\n")
    print(f"[Results] Saved detailed metrics report to {metrics_file}")

    # 11. Save Artifacts for Inference
    model_keras_path = os.path.join(MODEL_DIR, "intent_model.keras")
    model.save(model_keras_path)
    print(f"[Model] Saved Keras model to {model_keras_path}")

    # Save tokenizer
    tokenizer_pickle_path = os.path.join(MODEL_DIR, "tokenizer.pickle")
    with open(tokenizer_pickle_path, "wb") as handle:
        pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"[Model] Saved Tokenizer to {tokenizer_pickle_path}")

    # Save label encoder
    encoder_pickle_path = os.path.join(MODEL_DIR, "label_encoder.pickle")
    with open(encoder_pickle_path, "wb") as handle:
        pickle.dump(label_encoder, handle, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"[Model] Saved Label Encoder to {encoder_pickle_path}")

    # Save metadata (useful for API and Frontend)
    metadata = {
        "model_name": "VoiceAssist AI BiLSTM Intent Classifier",
        "deep_learning_framework": f"TensorFlow {tf.__version__}",
        "architecture": "Embedding(64) -> Bidirectional(LSTM(64)) -> Dropout(0.4) -> Dense(64, ReLU) -> Dropout(0.3) -> Dense(Softmax)",
        "num_classes": num_classes,
        "classes": class_names,
        "max_length": max_length,
        "vocab_size": effective_vocab_size + 1,
        "total_dataset_size": len(texts),
        "training_accuracy": round(float(train_acc), 4),
        "validation_accuracy": round(float(val_acc), 4),
        "training_loss": round(float(train_loss), 4),
        "validation_loss": round(float(val_loss), 4),
        "macro_f1": round(float(f1_macro), 4),
        "weighted_f1": round(float(f1_weighted), 4)
    }
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[Model] Saved Model Metadata to {metadata_path}")
    print("\nTraining and evaluation pipeline completed successfully!")

if __name__ == "__main__":
    train_and_evaluate()
