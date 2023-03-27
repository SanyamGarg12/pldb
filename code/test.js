#!/usr/bin/env node

/*

* To investigate slowdowns:

code
 node --cpu-prof --cpu-prof-name=test.cpuprofile ./code/test.js

* Then:

- open a new Chrome tab
- open devtools
- click Performance
- click "Load Profile..."
- select your test.cpuprofile
*/
const lodash = require("lodash")
const path = require("path")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { ScrollDiskFileSystem, ScrollCli, ScrollFile } = require("scroll-cli")
const { Disk } = require("jtree/products/Disk.node.js")
const { TestRacer } = require("jtree/products/TestRacer.js")
const { Utils } = require("jtree/products/Utils.js")

const { PLDB } = require("../PLDB.js")

const rootDir = path.join(__dirname, "..")
const trueBasePagesDir = path.join(rootDir, "site", "truebase")

const testTree = {}
testTree.ensureNoErrorsInGrammar = areEqual => {
	const grammarErrors = new grammarNode(PLDB.folder.grammarCode)
		.getAllErrors()
		.map(err => err.toObject())
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0, "no errors in pldb grammar")
}

testTree.ensureNoErrorsInScrollExtensions = areEqual => {
	const grammarErrors = new ScrollDiskFileSystem().getGrammarErrorsInFolder(
		__dirname
	)
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0, "no errors in scroll extensions")
}

// // todo
// testTree.ensureNoErrorsInBlog = areEqual => {
// 	const checkScroll = folderPath => {
// 		// Do not check all ~5K generated scroll files for errors b/c redundant and wastes time.
// 		// Just check the Javascript one below.
// 		if (folderPath.includes("truebase")) return
// 		const folder = new ScrollFolder(folderPath)
// 		areEqual(
// 			folder.grammarErrors.length,
// 			0,
// 			`no scroll errors in ${folderPath}`
// 		)
// 		//areEqual(folder.errors.length, 0, `no errors in ${folderPath}`)
// 	}

// 	const cli = new ScrollCli()
// 	cli.verbose = false
// 	Object.keys(cli.findScrollsInDirRecursive(rootDir)).map(checkScroll)

// 	const jsPagePath = path.join(trueBasePagesDir, "javascript.scroll")
// 	const jsFile = new ScrollFile(Disk.read(jsPagePath), jsPagePath)
// 	const errors = jsFile.scrollScriptProgram.getAllErrors()
// 	if (errors.length) console.log(errors)
// 	areEqual(
// 		errors.length,
// 		0,
// 		"no scroll errors in a generated language scroll file"
// 	)
// }

testTree.ensureGoodFilenames = areEqual => {
	areEqual(
		PLDB.folder.filesWithInvalidFilenames.length,
		0,
		`all ${PLDB.folder.length} filenames are valid`
	)
}

testTree.ensureNoBrokenPermalinks = areEqual => {
	areEqual(
		!!PLDB.folder.pageRankLinks,
		true,
		"should not throw because of broken permalink"
	)
}

testTree.ensureNoErrorsInDb = areEqual => {
	const { errors } = PLDB.folder
	if (errors.length)
		errors.forEach(err =>
			console.log(
				err._node.root.get("title"),
				err._node.getFirstWordPath(),
				err
			)
		)
	areEqual(errors.length, 0, "no errors in db")
}

testTree.ensureSortWorks = areEqual => {
	const programParser = PLDB.folder.grammarProgramConstructor
	const program = new programParser(`appeared 1923\ntitle foo`)
	program.sortFromSortTemplate()
	areEqual(program.toString(), "title foo\nappeared 1923")
}

testTree.ensureSortCausesNoSemanticChanges = areEqual => {
	// Arrange
	const pre = PLDB.folder.typedMap

	// Act
	PLDB.folder.forEach((file, index) => {
		const originalTypedMap = file.typedMap
		if (index > 10) return
		file.sort()
		const sorted = file.typedMap

		areEqual(
			lodash.isEqual(originalTypedMap, file.typedMap),
			true,
			"typed map doesnt change after sort"
		)

		const sortedOnce = file.toString()
		file.sort()

		const sortedTwice = file.toString()

		areEqual(sortedOnce, sortedTwice, `sort is stable`)
	})
}

if (module && !module.parent) TestRacer.testSingleFile(__filename, testTree)

module.exports = { testTree }
