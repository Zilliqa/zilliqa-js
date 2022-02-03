set -o errexit

mkdir $HOME/zilliqa-js-e2e && cd $HOME/zilliqa-js-e2e && npm init -y
echo "import * as Z from '@zilliqa-js/zilliqa';" > index.ts

ls
pwd

yarn add -D typescript@4.4.4
yarn add @zilliqa-js/zilliqa@e2e --registry http://localhost:4873
cat node_modules/@zilliqa-js/crypto/package.json
cat index.ts

npx tsc ./index.ts --target es5 --noEmit \
--esModuleInterop --forceConsistentCasingInFileNames \
--strict --skipLibCheck false

echo "PASS:tsc"

cd $HOME
