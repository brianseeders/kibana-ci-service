docker stop kibana-ci-service || true
docker run --name kibana-ci-service --rm -d -e 'PORT=60000' -p 60000:60000 kibana-ci-service