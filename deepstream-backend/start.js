var DeepstreamServer = require('deepstream.io'),
    server = new DeepstreamServer();

server.set("host", "localhost");
server.set("port", "6030");

server.start();
