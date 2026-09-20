# SPDX-License-Identifier: MIT
"""Serve IPv4 health checks and IPv6 private traffic on the same socket."""
import os
import socket

import uvicorn


def create_listener(port):
    listener = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    try:
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        listener.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        listener.bind(("::", port))
        listener.listen(128)
        return listener
    except Exception:
        listener.close()
        raise


if __name__ == "__main__":
    with create_listener(int(os.getenv("PORT", "8000"))) as listener:
        uvicorn.Server(uvicorn.Config("main:app", access_log=False)).run(sockets=[listener])
