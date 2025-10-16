FROM ubuntu:latest

RUN apt-get update
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN apt-get install -y npm
RUN apt-get install -y golang
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup update
RUN cargo install wasm-pack

COPY . /promisewrite/

WORKDIR /promisewrite

CMD ["./run.sh"]
