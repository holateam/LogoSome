## Authors

* Alex Belokon (<info.tehnokot@gmail.com>)

## Getting Started

To get started with the backend logosome do the following steps:

#### Download

Clone the project, use the next command:
```bash
git clone https://github.com/holateam/logosome.git
```

#### Install dependencies

First, install nodejs if you had not already done.
```bash
https://nodejs.org/en/
```

To install necessary packages open the backend project folder in terminal, and use the next command:
```bash
cd backend && npm i
```

#### Connect Mongo database

Open the file config.json and in the "urli" add a reference to the Mongo database
```bash
sudo nano config.json
```
example:
```code
"mongoose": {
    "urli": "mongodb://test:root@test.mlab.com:0000/test"
  }

```
#### Starting the server
In a terminal, go to the folder "bin" and run the server.
```bash
sudo npm start
```