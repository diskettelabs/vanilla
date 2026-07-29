#!/usr/bin/env bash
echo "Direct execution:"
echo "  stdin (-t 0): $(test -t 0 && echo 'TTY' || echo 'NOT TTY')"
echo "  stdout (-t 1): $(test -t 1 && echo 'TTY' || echo 'NOT TTY')"
echo "  stderr (-t 2): $(test -t 2 && echo 'TTY' || echo 'NOT TTY')"
