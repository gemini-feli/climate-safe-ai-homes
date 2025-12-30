package com.climatesafe.ml;

import weka.classifiers.Classifier;
import weka.classifiers.trees.J48;
import weka.core.Instances;
import weka.core.converters.CSVLoader;
import weka.core.SerializationHelper;
import weka.filters.Filter;
import weka.filters.unsupervised.attribute.NumericToNominal;

import java.io.File;
import java.io.FileWriter;
import java.io.BufferedWriter;

public class TrainFloodModel {

    public static void main(String[] args) throws Exception {
        // 1. Load CSV dataset
        CSVLoader loader = new CSVLoader();
        loader.setSource(new File("datasets/mumbai_disaster_labeled_with_elevation.csv"));
        Instances data = loader.getDataSet();

        // 2. Convert last attribute (disaster_type) from numeric → nominal
        NumericToNominal convert = new NumericToNominal();
        convert.setAttributeIndices("" + data.numAttributes()); // last column
        convert.setInputFormat(data);
        data = Filter.useFilter(data, convert);

        // 3. Set class attribute (target column: disaster_type)
        data.setClassIndex(data.numAttributes() - 1);

        // 4. Train classifier (J48 Decision Tree)
        Classifier classifier = new J48();
        classifier.buildClassifier(data);

        // 5. Save trained model
        File modelFile = new File("models/flood_model_mumbai.model");
        SerializationHelper.write(modelFile.getAbsolutePath(), classifier);

        // 6. Save ARFF header (without instances, just structure)
        File headerFile = new File("models/header.arff");
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(headerFile))) {
            writer.write(data.stringFreeStructure().toString());
        }

        System.out.println("✅ Flood model trained and saved!");
        System.out.println("Model: " + modelFile.getAbsolutePath());
        System.out.println("Header: " + headerFile.getAbsolutePath());
    }
}
