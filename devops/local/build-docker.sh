echo "======= build docker ======="

function buildProject() {
  local projectImage="${CONTAINER_IMAGE}:${CI_COMMIT_REF_NAME}"
  
  echo "docker pull ${projectImage}"
  docker pull ${projectImage} || true

  echo "======= start build ${projectImage} ======="
  docker build --cache-from ${projectImage} --tag ${projectImage} ./
  docker push ${projectImage}

  docker run -w /app -v $(pwd)/${DOCSET_NAME}:/app/${DOCSET_NAME} ${projectImage} sh -c "node index.js"
}

cd ${projectDir}
buildProject
