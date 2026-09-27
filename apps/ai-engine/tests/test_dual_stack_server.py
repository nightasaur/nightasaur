import socket

from serve import create_listener


def test_listener_accepts_both_healthcheck_and_private_network_families():
    with create_listener(0) as listener:
        port = listener.getsockname()[1]
        for host in ("127.0.0.1", "::1"):
            with socket.create_connection((host, port), timeout=2):
                connection, peer = listener.accept()
                connection.close()
                assert peer
