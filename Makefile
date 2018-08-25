.PHONY:*

build-personal:
	@ currentBranch=`git rev-parse --abbrev-ref HEAD`; \
	if [ "$$currentBranch" != "develop" -a "$$currentBranch" != "master" ]; then \
		 git add -A; \
		 git commit --amend --no-edit; \
	   echo "======  git push origin $$currentBranch -f  =========="; \
		 git push origin $$currentBranch -f; \
	else \
		 git add -A; \
		 git commit --amend --no-edit; \
	   echo "======  git push temp $$currentBranch:temp -f  =========="; \
		 git push temp $$currentBranch:temp -f; \
	fi