echo "======= build docker ======="

function buildProject() {
  local projectImage="${CONTAINER_IMAGE}:${CI_COMMIT_REF_NAME}"
  local stageImage="${CONTAINER_IMAGE}/tool-build:${CI_COMMIT_REF_NAME}"
  
  echo "docker pull ${projectImage}"
  docker pull ${projectImage} || true

  echo "docker pull ${stageImage}"
  docker pull ${stageImage} || true

  echo "======= start build ${projectImage} ======="
  docker build --cache-from ${projectImage} --cache-from ${stageImage} --tag ${projectImage} ./

  # build docset 
  docker run -w /app -v $(pwd)/${DOCSET_NAME}:/app/${DOCSET_NAME} ${projectImage} sh -c "node index.js"
  
  # save images
  local id=`docker images -f "label=label=tool-build" --format "{{.CreatedAt}}\t{{.ID}}" | sort -nr | head -n 1 | cut -f2`
  docker tag ${id} ${stageImage}
  docker push ${stageImage}

  docker push ${projectImage}
  

}

cd ${projectDir}
buildProject
