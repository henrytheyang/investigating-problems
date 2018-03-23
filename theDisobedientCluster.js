const cluster = require('cluster');
const numCPUs = require('os').cpus().length; // 4

let trackWorkersDoneWithFunctionOne = (singleWorker) => {
  return new Promise((resolve, reject) => {
    singleWorker.on('disconnect', () => {
      resolve();
    });
  });
};

let someFunctionOne = () => {
  console.log('Hi there I\'m function one');
  process.exit();
};
let someFunctionTwo = () => {
  console.log('Hi there I\'m function two');
  process.exit();
};

// Multi-threaded approach to seeding.
function functionOneMultiWrapper() {
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running in firstFunction`);
    // Promise storage to track when workers are done
    let workersDoneWithOne = [];
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      let worker = cluster.fork();
      console.log(`firstFunction started worker ${worker.process.pid}`);
      workersDoneWithOne.push(trackWorkersDoneWithFunctionOne(worker));
    }
    Promise.all(workersDoneWithOne).then(() => {
      console.log('promise.all resolved');
      functionTwoMultiWrapper();
    });

    cluster.on('exit', (worker, code, signal) => {
      console.log('first function exit block');
      console.log(`worker ${worker.process.pid} finished`);
    });
  } else {
    console.log(`Worker ${process.pid} started running firstFunction`);
    someFunctionOne();
  }
}

const functionTwoMultiWrapper = () => {
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running in secondFunction`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      let worker = cluster.fork();
      console.log(`secondFunction started worker ${worker.process.pid}`);
    }
    cluster.on('exit', (worker, code, signal) => {
      console.log('second function exit block');
      console.log(`worker ${worker.process.pid} finished`);
    });
  } else {
    console.log(`Worker ${process.pid} started running secondFunction`);
    someFunctionTwo();
  }
};

functionOneMultiWrapper();


// PASS IN AN ENVIRONMENTAL VARIABLE TO CLUSTER.FORK
// When cluster workers are created they go to the top of the page and run through the code, going down through the worker fork
// So here they call the first function, and end up in the promise block. Inside the promise block there's another call to fork
// Again, the workers here will start at the top of the page and go through the code, landing in the worker block of the first
// function, calling the first function a second time.