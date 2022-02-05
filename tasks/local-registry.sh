set -o errexit

port=4873
local_registry=http://localhost:$port
echo $local_registry

npm install -g verdaccio@5.2.0

verdaccio --config verdaccio.yml &
npx wait-port $port

git checkout -b e2e

npx lerna publish patch --registry $local_registry \
--no-verify-access --force-publish=* --no-push --allow-branch=e2e \
--ignore-scripts --dist-tag e2e --yes
