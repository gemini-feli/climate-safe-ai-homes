import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models, optimizers
from tensorflow.keras.callbacks import EarlyStopping
import json

# ---- Parameters ----
IMG_SIZE = (128, 128)
BATCH_SIZE = 8
EPOCHS = 20
DATASET_DIR = "flood_dataset"
MODEL_NAME = "flood_impact_mobilenetv2.h5"
CLASS_LABELS_FILE = "flood_impact_class_labels.txt"

# ---- Data Augmentation ----
datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    validation_split=0.2
)

train_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    color_mode='rgb',
    shuffle=True
)

val_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    color_mode='rgb',
    shuffle=False
)

# ---- Save class labels in order ----
class_indices = train_gen.class_indices
print("Class indices:", class_indices)

# Save labels in index order
sorted_labels = [None] * len(class_indices)
for label, index in class_indices.items():
    sorted_labels[index] = label.title()

with open(CLASS_LABELS_FILE, "w") as f:
    for label in sorted_labels:
        f.write(label + "\n")
print(f"✅ Class labels saved to {CLASS_LABELS_FILE}: {sorted_labels}")

# ---- Pretrained MobileNetV2 ----
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3))
base_model.trainable = False

# ---- Build Model ----
model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(train_gen.num_classes, activation='softmax')
])

model.compile(
    optimizer=optimizers.Adam(1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# ---- Train ----
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    callbacks=[early_stop]
)

# ---- Save Model ----
model.save(MODEL_NAME)
print(f"✅ Model saved as {MODEL_NAME}")
