set -o errexit

port=4873
local_registry=http://localhost:$port
echo $local_registry

npm install -g verdaccio@5.2.0

verdaccio --config verdaccio.yml &
npx wait-port $port

git checkout -b e2e

npx lerna version patch --force-publish=* --no-push --no-git-tag-version --yes

git commit --no-verify -a -m 'version-bump'

npx lerna publish --registry $local_registry --no-verify-access --ignore-scripts --dist-tag e2e --canary --yes
