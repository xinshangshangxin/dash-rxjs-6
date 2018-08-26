wget --no-check-certificate \
https://github.com/aktau/github-release/releases/download/${GITHUB_RELEASE_VERSION}/linux-amd64-github-release.tar.bz2 -O - | tar -xjf - -C /tmp \
&& mv /tmp/bin/linux/amd64/github-release /usr/local/bin \
&& rm -rf /tmp/

cd ${projectDir}

zip -r ${GITHUB_UPLOAD_ZIP_NAME} ${GITHUB_UPLOAD_PATH}
ls -la 


github-release release \
    -u ${GITHUB_USER} \
    -r ${GITHUB_REPO} \
    -t ${CI_COMMIT_REF_NAME} \
    -n ${GITHUB_UPLOAD_ZIP_NAME}

github-release upload \
    -u ${GITHUB_USER} \
    -r ${GITHUB_REPO} \
    --tag ${CI_COMMIT_REF_NAME} \
    --file ${GITHUB_UPLOAD_ZIP_NAME} \
    --name ${GITHUB_UPLOAD_ZIP_NAME} \
    -R


