SOURCES=dateutils.ts http.ts promises.ts sphere.ts tests/resources.ts

all: $(SOURCES)
	./qtsc $^
	@echo "Build complete."

test: all
	rm ~/Library/Application\ Support/qmltestrunner/QML/OfflineStorage/Databases/*
	qmltestrunner
