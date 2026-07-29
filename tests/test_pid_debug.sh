#!/usr/bin/env bash

echo "Current script PID: $$"

echo "Starting subshell..."
(
    echo "Subshell PID: $$"
    sleep 100
) &

subshell_pid=$!
echo "Captured PID: $subshell_pid"
echo "Current script PID again: $$"

ps -f -p $subshell_pid

kill $subshell_pid
