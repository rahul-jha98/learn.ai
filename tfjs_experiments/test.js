class ModelCreator {
  constructor(noOfInputVars) {
    this.model = tf.sequential();
    this.previousInputShape = noOfInputVars;
  }

  getTensorMap(data, channels = 2) {
    var refData = data;
    var tensorShape = [];
    for (var i = 1; i <= channels; i++) {
      tensorShape.push(refData.length);
      refData = refData[0];
    }
    return tf.tensor2d(data, tensorShape);
  }

  addDenseLayer(noOfUnits, activation = "sigmoid") {
    if (this.previousInputShape != -1) {
      this.model.add(
        tf.layers.dense({
          units: noOfUnits,
          inputShape: this.previousInputShape,
          activation: activation,
          kernelInitializer: "heNormal"
        })
      );
    } else {
      this.model.add(
        tf.layers.dense({
          units: noOfUnits,
          activation: activation,
          kernelInitializer: "heNormal"
        })
      );
    }

    this.previousInputShape = -1;
  }

  addConvLayer(n_filters, kernelSize = 3, strides = 1, activation = "relu") {
    if (this.previousInputShape != -1) {
      this.model.add(
        tf.layers.conv2d({
          filters: n_filters,
          kernelSize: kernelSize,
          strides: strides,
          activation: activation,
          kernelInitializer: "heNormal",
          inputShape: this.previousInputShape
        })
      );
      this.previousInputShape = -1;
    } else {
      this.model.add(
        tf.layers.conv2d({
          filters: n_filters,
          kernelSize: kernelSize,
          strides: strides,
          activation: activation,
          kernelInitializer: "heNormal"
        })
      );
    }
  }

  addMaxPoolLayer(poolSize = [2, 2]) {
    this.model.add(
      tf.layers.maxPooling2d({
        poolSize: poolSize
      })
    );
  }

  flatten() {
    this.model.add(tf.layers.flatten());
  }

  compileModel(parameters) {
    this.model.compile(parameters);
  }

  async trainModel(
    trainXList,
    trainYList,
    epochs = 1000,
    channel1 = 2,
    channel2 = 2
  ) {
    await this.model.fit(
      this.getTensorMap(trainXList, channel1),
      this.getTensorMap(trainYList, channel2),
      { epochs: epochs }
    );
  }

  makePredictions(testXList) {
    var data = this.getTensorMap(testXList);
    console.log(data.data);
    this.model.predict(this.getTensorMap(testXList)).print();
  }
}

var modelJson = JSON.parse(
  '{"model": 2,"layers": [ {"type": "dense","no": 8, "activation": "tanh"},{"type": "dense","no": 4, "activation": "relu"},{ "type": "dense", "no": 1, "activation": "sigmoid"}], "parameters": { "optimizer": { "type": "adam", "lr": "0.02" },"loss": "binaryCrossentropy", "epochs": 10}}'
);

console.log(modelJson);

function initializeModelFromJSON(modelJson) {
  let inputSize = modelJson.model;
  let layers = modelJson.layers;

  let creator = new ModelCreator([inputSize]);

  layers.forEach(layer => {
    if (layer.type === "dense") {
      creator.addDenseLayer(layer.no, layer.activation);
    }
  });

  let optimizerStr = modelJson.parameters.optimizer.type;

  var optimizer;
  if (optimizerStr === "adam") {
    optimizer = tf.train.adam(
      (learningRate = modelJson.parameters.optimizer.lr),
      (beta1 = 0.2)
    );
  }

  creator.compileModel({
    optimizer: optimizer,
    loss: modelJson.parameters.loss
  });

  return creator;
}

var runner = initializeModelFromJSON(modelJson);

// Train model with fit().

// // Run inference with predict().

var X = [[0, 0], [0, 1], [1, 0], [1, 1]]
var y = [[0], [1], [1], [0]]
var XTest = [[1, 1], [1, 1], [1, 0], [1, 1], [0, 1],  [0, 1]]
var epochs = 500

runner.trainModel(
    X,
    y,
    epochs
).then(() => {
    console.log("Done with training")
    runner.makePredictions(XTest)
})

// var X = "X = np.array(" + X.toString() +  ")"


function getTextsForLayer(layer) {
    text = "nn.Linear(" + layer.kernel.shape + ")"
    
    if (layer.activation.__proto__.constructor.className === 'tanh') {
        text += ", nn.Tanh(),"
    } else if (layer.activation.__proto__.constructor.className === 'sigmoid') {
        text += ", nn.Sigmoid(),"
    } else if (layer.activation.__proto__.constructor.className === 'relu') {
        text += ", nn.ReLU(),"
    } else if (layer.activation.__proto__.constructor.className === 'linear') {
        text += ","
    }
    return text
}


function getPytorchModel(modelData) {
    let allImports = [
        "import numpy as np",
        "import torch",
        "from torch import nn",
        "from torch.autograd import Variable",
        "from torch import FloatTensor",
        "from torch import optim"
    ];
    let shapeX = runner.getTensorMap(X).shape
    let shapeY = runner.getTensorMap(y).shape

    let middleParts = [
        "use_cuda = torch.cuda.is_available()",
        "X = np.array([" + X +  "])",
        "X = X.reshape(" + shapeX + ")",
        "y = np.array([" + y + "])",
        "y = y.reshape(" + shapeY + ")",
        "# Converting the X to PyTorch-able data structure.",
        "X_pt = Variable(FloatTensor(X))",
        "X_pt = X_pt.cuda() if use_cuda else X_pt",
        "# Converting the Y to PyTorch-able data structure.",
        "Y_pt = Variable(FloatTensor(y), requires_grad=False)",
        "Y_pt = Y_pt.cuda() if use_cuda else Y_pt"
    ]


    let modelsArea = ["model = nn.Sequential("]

    modelData.layers.forEach(layer => {
        modelsArea.push("\t" + getTextsForLayer(layer))
    })

    var str = modelsArea[modelsArea.length - 1]
    str = str.substr(0,str.length - 1) + ")"
    modelsArea[modelsArea.length - 1] = str

   modelsArea.push("if use_cuda:\n\tmodel.cuda()")
   modelsArea.push("criterion = nn.BCELoss()")
   modelsArea.push("learning_rate = 0.02")
   modelsArea.push("optimizer = optim.Adam(model.parameters(), lr = learning_rate)")
   modelsArea.push("epochs = "+ epochs )



   modelsArea.push("for _ in range(epochs):")
   modelsArea.push("\tpredictions = model(X_pt)")
   modelsArea.push("\tloss_this_epoch = criterion(predictions, Y_pt)")
   modelsArea.push("\tloss_this_epoch.backward()")
   modelsArea.push("\toptimizer.step()")

   let testParts = [
    "XTest = np.array([" + XTest +  "])",
    "XTest = XTest.reshape(" + runner.getTensorMap(XTest).shape + ")",
    "XTest_pt = Variable(FloatTensor(XTest))",
    "XTest_pt = XTest_pt.cuda() if use_cuda else XTest_pt",
    "for _x in XTest_pt:",
    "\tprediction = model(_x)",
    "\tprint('Input:\t', list(map(int, _x)))",
    "\tprint('Pred:\t', prediction)",
    "\tprint('######')"
   ]

   let python = ""

    allImports.forEach(text => {
     
        python += text + '\n'
    })

    python += '\n\n'

    middleParts.forEach(text => {

        python += text + '\n'
    })

    python += '\n\n'

    modelsArea.forEach(text => {
       
        python += text + '\n'
    })

    python += '\n\n'

    testParts.forEach(text => {
    
      python += text + '\n'
    })    
    return python
}
// Train model with fit().

// // Run inference with predict().
getPytorchModel(runner.model)