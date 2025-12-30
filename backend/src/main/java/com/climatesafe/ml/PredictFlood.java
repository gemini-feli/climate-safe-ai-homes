package com.climatesafe.ml;

import weka.classifiers.Classifier;
import weka.core.Instance;
import weka.core.Instances;
import weka.core.SerializationHelper;
import weka.core.DenseInstance;
import weka.core.converters.ConverterUtils.DataSource;

public class PredictFlood {

    private static Classifier model;
    private static Instances header;

    static {
        try {
            // Load model
            model = (Classifier) SerializationHelper.read("models/flood_model_mumbai.model");

            // Load header (structure only, no data)
            DataSource source = new DataSource("models/header.arff");
            header = source.getDataSet();
            header.setClassIndex(header.numAttributes() - 1);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 👉 Predict method that your Controller can call
    public static int predict(double temp, double humidity, double wind, double rainfall) throws Exception {
        Instance instance = new DenseInstance(header.numAttributes());
        instance.setDataset(header);

        instance.setValue(0, temp);
        instance.setValue(1, humidity);
        instance.setValue(2, wind);
        instance.setValue(3, rainfall);

        double prediction = model.classifyInstance(instance);
        return (int) prediction;
    }
}
