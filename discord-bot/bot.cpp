#include <unordered_set>

#include "sleepy_discord/sleepy_discord.h"
#include "IO_file.h"

//bolderplate code
bool startsWith(const std::string& target, const std::string& test) {
	return target.compare(0, test.size(), test) == 0;
}

std::queue<std::string> split(const std::string& source) {
	std::stringstream ss(source);
	std::string item;
	std::queue<std::string> target;
	while (std::getline(ss, item, ' '))
		if (!item.empty())
			target.push(item);
	return target;
}

void makeLowerCaseOnly(std::string& string) {
	std::transform(string.begin(), string.end(), string.begin(),
		[](unsigned char c) { return std::tolower(c); });
}

//Discord repo watch
class DiscordAPIDocsRepoWatcher {
public:
	void pollTomarrow(SleepyDiscord::DiscordClient& client) {
		client.schedule([=, &client]() {
			client.sendMessage("466386704438132736", "poll repo", SleepyDiscord::Async);
			pollImplementation(client);
			pollTomarrow(client);
		}, oneDayInMilliseconds);
	}

	const bool started() {
		return !lastCommitSha.empty();
	}

	void start(SleepyDiscord::DiscordClient& client) {
		if (started())
			return;

		asio::post([=, &client]() {
			//get lastCommitSha
			//to do this code is used twice, make it a function
			auto response = cpr::Get(cpr::Url{ repoCommitsLink });
			if (response.status_code != 200)
				return;
			
			rapidjson::Document document;
				document.Parse(response.text.c_str(), response.text.length());
			if (document.HasParseError())
				return;

			auto commits = document.GetArray();
			auto& lastCommit = commits[0];
			auto sha = lastCommit.FindMember("sha");
			if (sha == lastCommit.MemberEnd() || !sha->value.IsString())
				return;
			
			lastCommitSha = std::string{sha->value.GetString(), 
				sha->value.GetStringLength()};

			pollTomarrow(client);
		});
	}
private:
	void pollImplementation(SleepyDiscord::DiscordClient& client) {
		asio::post([=, &client]() {
			const SleepyDiscord::Snowflake<SleepyDiscord::Channel>
				channel = "721828297087909950";

			auto response = cpr::Get(cpr::Url{ repoCommitsLink });
			if (response.status_code != 200)
				return;

			rapidjson::Document document;
				document.Parse(response.text.c_str(), response.text.length());
			if (document.HasParseError())
				return;

			auto commits = document.GetArray();
			auto lastCommitIterator = commits.end();
			int index = 0;
			for (auto& commit : commits) {
				auto sha = commit.FindMember("sha");
				if (sha == commit.MemberEnd() || !sha->value.IsString()) {
					index += 1;
					continue;
				}
				//to do use string_view
				std::string shaStr{ sha->value.GetString(), sha->value.GetStringLength() };
				if (lastCommitSha == shaStr) {
					lastCommitIterator = commits.begin() + index;
					break;
				}
				index += 1;
			}

			if (lastCommitIterator == commits.begin()) {
				//no new commits
				return;
			}

			SleepyDiscord::Embed embed;

			//since the commits are sorted newest first, we need to go backwards to make it
			//fit Discord's message order being oldest first/top.
			for (
				auto commit = lastCommitIterator - 1;
				commit != commits.begin() - 1; //sub 1 as begin() is valid
				commit -= 1
			) {
				auto sha = commit->FindMember("sha");
				if (sha == commit->MemberEnd() || !sha->value.IsString()) {
					continue;
				}

				if (commit == commits.begin()) {
					lastCommitSha = std::string {
						sha->value.GetString(),
						sha->value.GetStringLength()
					};
				}

				auto data = commit->FindMember("commit");
				if (data == commit->MemberEnd() || !data->value.IsObject()) {
					continue;
				}
				auto messageMember = data->value.FindMember("message");
				if (messageMember == data->value.MemberEnd() || !messageMember->value.IsString()) {
					continue;
				}
				auto htmlLinkMember = commit->FindMember("html_url");
				if (htmlLinkMember == commit->MemberEnd() || !htmlLinkMember->value.IsString()) {
					continue;
				}

				std::string hashDisplay {
					sha->value.GetString(),
					sha->value.GetStringLength() <= 9 ?
						sha->value.GetStringLength(): 9
				};

				std::string message {
					messageMember->value.GetString(),
					messageMember->value.GetStringLength()
				};

				std::string commitTitle;
				size_t newLinePOS = message.find_first_of('\n');
				if (newLinePOS == std::string::npos) {
					commitTitle = message;
				} else {
					commitTitle = message.substr(0, newLinePOS);
				}

				std::string commitLink;
				size_t linkSize =
					1 + hashDisplay.length() + 2 +
					htmlLinkMember->value.GetStringLength() + 1;
				commitLink += '[';
				commitLink += hashDisplay;
				commitLink += "](";
				commitLink += htmlLinkMember->value.GetString();
				commitLink += ')';

				embed.fields.push_back(SleepyDiscord::EmbedField{
					commitTitle,
					commitLink
				});

				//check if we are over the embed limits
				//to do list the embed limits in the library
				if (25 <= embed.fields.size()) {
					client.sendMessage(channel, "", embed,
						SleepyDiscord::TTS::Default,
						SleepyDiscord::Async);
					embed = SleepyDiscord::Embed{};
				}
			}

			client.sendMessage(channel, "", embed,
				SleepyDiscord::TTS::Default,
				SleepyDiscord::Async);
		});
	}

	const time_t oneDayInMilliseconds = 86400000;
	std::string lastCommitSha;
	const std::string repoCommitsLink =
		"https://api.github.com/repositories/54995014/commits";
};

//Discord client code
class WaifuClient;

namespace Command {
	using Verb = std::function<
		void(
			WaifuClient&,
			SleepyDiscord::Message&,
			std::queue<std::string>&
			)
	>;
	struct Command {
		std::string name;
		std::vector<std::string> params;
		Verb verb;
	};
	using MappedCommands = std::unordered_map<std::string, Command>;
	using MappedCommand = MappedCommands::value_type;
	static MappedCommands all;
	static void addCommand(Command command) {
		all.emplace(command.name, command);
	}
	static Command* defaultCommand = nullptr;
}

class WaifuClient : public SleepyDiscord::DiscordClient {
public:
	WaifuClient(const std::string token) :
		SleepyDiscord::DiscordClient(token, SleepyDiscord::USER_CONTROLED_THREADS),
		botStatusReporter(*this)
	{
		updateSearchTree();
	}

	void addServerID(SleepyDiscord::Snowflake<SleepyDiscord::Server>& serverID) {
		if (serverIDs.count(serverID) <= 0)
				serverIDs.insert(serverID);
	}

	void onReady(SleepyDiscord::Ready ready) override {
		static bool isFirstTime = true;
		discordAPIDocsRepoWatcher.start(*this);

		//set up serverIDs
		for (SleepyDiscord::UnavailableServer& server : ready.servers) {
			addServerID(server.ID);
		}
		if (!botsToken.empty() && !topToken.empty() && isFirstTime)
			botStatusReporter.start();

		isFirstTime = false;
	}
	
	void onServer(SleepyDiscord::Server server) override {
		addServerID(server.ID);
	}

	void onDeleteServer(SleepyDiscord::UnavailableServer server) override {
		if (
			0 < serverIDs.count(server.ID) &&
			server.unavailable == 
				SleepyDiscord::UnavailableServer::AvailableFlag::NotSet
		) {
			serverIDs.erase(server.ID);
	}
	}

	void onMessage(SleepyDiscord::Message message) override {
		if (message.isMentioned(getID()) || message.startsWith("whcg "))
		{
			std::queue<std::string> parameters = split(message.content);
			const std::string mention = "<@" + getID().string() + ">";
			const std::string mentionNick = "<@!" + getID().string() + ">";
			if (
				!(
					//only allow if has more then 1 parameter 
					1 < parameters.size() && (
						//only allow if starts with a mention
						parameters.front() == mention || parameters.front() == mentionNick ||
						//or starts with whcg
						parameters.front() == "whcg"
					)
				)
			)
				return;

			//remove the parameters as we go
			parameters.pop();
			if (parameters.empty())
				return;

			//get command
			Command::MappedCommands::iterator foundCommand =
				Command::all.find(parameters.front());
			if (foundCommand == Command::all.end()) {
				if (Command::defaultCommand != nullptr) {
					Command::defaultCommand->verb(*this, message, parameters);
				} else {
					sendMessage(message.channelID, "Error: Command not found", SleepyDiscord::Async);
				}
				return;
			}
			parameters.pop();
			if (
				parameters.size() <
				foundCommand->second.params.size()
				) {
				sendMessage(message.channelID, "Error: Too few parameters", SleepyDiscord::Async);
				return;
			}

			//call command
			foundCommand->second.verb(*this, message, parameters);
		} 
		// else if channel is the github updates channel, update search tree
		else if (message.channelID == "700570024523595786") {
			//we have the github webhook set up to only send page build updates
			asio::post([this]() {
				updateSearchTree();
			});
		}
	}

	void updateSearchTree() {
		//note this is blocking, so the whole bot stops while getting this data
		rapidjson::Document newSearchTree;
		auto response = cpr::Get(
			cpr::Url{ "https://yourwaifu.dev/is-your-waifu-legal/search-tree.json" });

		if (response.status_code != 200)
			return;

		newSearchTree.Parse(response.text.c_str(), response.text.length());
		if (newSearchTree.HasParseError())
			return;

		searchTree = std::move(newSearchTree);
	}

	const rapidjson::Document& getSearchTree() {
		return searchTree;
	}

	inline const int getServerCount() {
		return serverIDs.size();
	}

	const SleepyDiscord::Embed getStatus() {
		SleepyDiscord::Embed status;
		//to do use some template tuple magic
		status.fields.emplace_back("Server Count",
			std::to_string(getServerCount()), true);
		return status;
	}

	struct StatusData {
		int serverCount = 0;
		std::string& botsToken;
		std::string& topToken;
	};

	const StatusData getStatusData() {
		//add token data here
		return StatusData {
			getServerCount(),
			botsToken, topToken
		};
	}

	void setTokens(rapidjson::Document& tokenDoc) {
		auto tokenIterator = tokenDoc.FindMember("bots-ggToken");
		if (
			tokenIterator != tokenDoc.MemberEnd() &&
			tokenIterator->value.IsString()
		) {
			botsToken.assign(
				tokenIterator->value.GetString(),
				tokenIterator->value.GetStringLength());
		} else {
			std::cout << "bots-gg token not found\n";
		}

		//to do remove dup code
		tokenIterator = tokenDoc.FindMember("top-ggToken");
		if (
			tokenIterator != tokenDoc.MemberEnd() &&
			tokenIterator->value.IsString()
		) {
			topToken.assign(
				tokenIterator->value.GetString(),
				tokenIterator->value.GetStringLength());
		} else {
			std::cout << "top-gg token not found\n";
		}
	}

private:
	rapidjson::Document searchTree;
	DiscordAPIDocsRepoWatcher discordAPIDocsRepoWatcher;
	
	//Discord Bot status poster
	std::string botsToken;
	std::string topToken;

	class BotStatusReporter {
	public:
		BotStatusReporter(WaifuClient& _client) :
			client(_client)
		{
			
		}

		void start() {
			postStatus();
		}

		void postStatus() {
			asio::post([this]() {
				const StatusData data = client.getStatusData();

				{
					rapidjson::Document json;
					json.SetObject();
					rapidjson::Value guildCount;
					guildCount.SetInt(data.serverCount);
					json.AddMember("guildCount", guildCount, json.GetAllocator());

					rapidjson::StringBuffer buffer;
					rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
					json.Accept(writer);

					std::string postStatsLink = "https://discord.bots.gg/api/v1/bots/186151807699910656/stats";
					cpr::Post(
						cpr::Url{ postStatsLink },
						cpr::Header{
							{ "Content-Type", "application/json" },
							{ "Authorization", data.botsToken }
						},
						cpr::Body{ buffer.GetString(), buffer.GetSize() }
					);
				}
				
				//to do remove dup code
				{
					rapidjson::Document json;
					json.SetObject();
					rapidjson::Value guildCount;
					guildCount.SetInt(data.serverCount);
					json.AddMember("server_count", guildCount, json.GetAllocator());

					rapidjson::StringBuffer buffer;
					rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
					json.Accept(writer);

					std::string postStatsLink = "https://top.gg/api/bots/186151807699910656/stats";
					cpr::Post(
						cpr::Url{ postStatsLink },
						cpr::Header{
							{ "Content-Type", "application/json" },
							{ "Authorization", data.topToken }
						},
						cpr::Body{ buffer.GetString(), buffer.GetSize() }
					);
				}

				const time_t postInterval = 300000; //5 mins
				client.schedule([this]() {
					postStatus();
				}, postInterval);
			});
		}

		WaifuClient& client;
	};
	BotStatusReporter botStatusReporter;

	//to do add language options for each server
	std::unordered_set<
		SleepyDiscord::Snowflake<SleepyDiscord::Server>::RawType
	> serverIDs;
};

int main() {
	rapidjson::Document tokenDoc;
	std::string token;
	{
		std::string tokenJSON;
		File tokenFile("tokens.json");
		const std::size_t tokenSize = tokenFile.getSize();
		if (tokenSize == static_cast<std::size_t>(-1)) {
			std::cout << "Error: Can't find tokens.json\n";
			return 1;
		}
		tokenJSON.resize(tokenSize);
		tokenFile.get<std::string::value_type>(&tokenJSON[0]);
		tokenDoc.Parse(tokenJSON.c_str(), tokenJSON.length());
		if (tokenDoc.HasParseError()) {
			std::cout << "Error: Couldn't parse tokens.json\n";
			return 1;
		}
		
		auto tokenIterator = tokenDoc.FindMember("discordToken");
		if (
			tokenIterator == tokenDoc.MemberEnd() &&
			tokenIterator->value.IsString()
		) {
			std::cout << "Error: Can't find discordToken in tokens.json\n";
			return 1;
		}
		token.assign(
			tokenIterator->value.GetString(),
			tokenIterator->value.GetStringLength());
	}

	//to do add a on any message array of actions to do

	Command::addCommand({
		"help", {}, [](
			WaifuClient& client,
			SleepyDiscord::Message& message,
			std::queue<std::string>&
		) {
			constexpr char start[] = "Here's a list of all commands:```\n";
			constexpr char theEnd[] = "```";
			//estimate length
			std::size_t length = strlen(start) + strlen(theEnd);
			for (Command::MappedCommand& command : Command::all) {
				length += command.first.size();
				length += 2; // ' ' and '\n'
				for (std::string& parmaName : command.second.params) {
					length += 2; // '<' and '> '
					length += parmaName.size();
				}
			}
			
			std::string output;
			output.reserve(length);
			output += start;
			for (Command::MappedCommand& command : Command::all) {
				output += command.first;
				output += ' ';
				for (std::string& parmaName : command.second.params) {
					output += '<';
					output += parmaName;
					output += "> ";
				}
				output += '\n';
			}
			output += theEnd;
			client.sendMessage(message.channelID, output, SleepyDiscord::Async);
		}
	});

	Command::addCommand({
		"hello", {}, [](
			WaifuClient& client,
			SleepyDiscord::Message& message,
			std::queue<std::string>& params
		) {
			client.sendMessage(message.channelID, "Hello, " + message.author.username, SleepyDiscord::Async);
		}
	});

	Command::addCommand({
		"status", {}, [](
			WaifuClient& client,
			SleepyDiscord::Message& message,
			std::queue<std::string>& params
		) {
			client.sendMessage(message.channelID, "", client.getStatus(),
			SleepyDiscord::TTS::Default,
			SleepyDiscord::Async);
		}
	});

	Command::addCommand({
		"legal", {"waifu's name"}, [](
			WaifuClient& client,
			SleepyDiscord::Message& message,
			std::queue<std::string>& params
		) {
			if (params.empty())
				return;

			std::string waifuName{};
			waifuName.reserve(message.content.length());

			while (true) {
				waifuName += params.front();
				params.pop();
				if (!params.empty()) {
					waifuName += "%20";
				} else {
					break;
				}
			}
			makeLowerCaseOnly(waifuName);

			asio::post([waifuName, &client, message]() {
				auto response = cpr::Get(
					cpr::Url{ "https://yourwaifu.dev/is-your-waifu-legal/waifus/" +
					waifuName + ".json" });

				std::string topMessage;

				if (response.status_code != 200) {
					const std::string messageStart =
						"Couldn't find the waifu you requested.\n";
					const std::string messageEnd =
						"You can add them by following this link: "
						"<https://github.com/yourWaifu/is-your-waifu-legal#how-to-add-a-waifu-to-the-list>";
					const auto failure = [=, &client]() {
						client.sendMessage(message.channelID,
							messageStart + messageEnd,
							SleepyDiscord::Async);
					};

					//use the search tree to get predictions on what the user wanted
					const auto& searchTree = client.getSearchTree();
					if (searchTree.HasParseError())
						return failure();
					
					const auto searchRootIterator = searchTree.FindMember("root");
					if (searchRootIterator == searchTree.MemberEnd() || !searchRootIterator->value.IsObject())
						return failure();

					const auto& searchRootValue = searchRootIterator->value;
					auto childrenIterator = searchRootValue.FindMember("c"/*children*/);
					if (childrenIterator == searchRootValue.MemberEnd() || !childrenIterator->value.IsObject())
						return failure();

					const auto allKeysIterator = searchTree.FindMember("allKeys");
					if (allKeysIterator == searchTree.MemberEnd() || !allKeysIterator->value.IsArray())
						return failure();

					size_t letterIndex = 0;
					auto position = searchRootIterator;
					for (const std::string::value_type& letter : waifuName) {
						const auto branches = position->value.FindMember("c"/*children*/);
						if (branches == position->value.MemberEnd())
							break;
						rapidjson::Value letterValue;
						letterValue.SetString(&letter, 1);
						auto nextPosition = branches->value.FindMember(letterValue);
						if (nextPosition == branches->value.MemberEnd() || nextPosition->value.IsNull())
							break;

						position = nextPosition;
						letterIndex += 1;
					}
					
					auto topPredictionIterator = position->value.FindMember("v"/*value*/);
					if (topPredictionIterator == position->value.MemberEnd() ||
						!topPredictionIterator->value.IsInt() || letterIndex == 0)
						return failure();

					const nonstd::string_view lettersInCommonAtStart{
						waifuName.c_str(), letterIndex
					};
					const int maxNumOfPredictions = 5;
					int topPrediction = topPredictionIterator->value.GetInt();
					std::vector<std::string> topPredictions;
					topPredictions.reserve(maxNumOfPredictions);
					
					const auto allKeys = allKeysIterator->value.GetArray();
					for (int i = 0; i < maxNumOfPredictions; i += 1) {
						int index = topPrediction + i;
						if (allKeys.Size() <= index)
							break; //out of range
						const auto& prediction = allKeys.operator[](index);
						//check if it starts with letters in common
						if (prediction.GetStringLength() < letterIndex)
							//too small
							break;
						if (nonstd::string_view{ prediction.GetString(), letterIndex } ==
							lettersInCommonAtStart)
						{
							topPredictions.emplace_back(prediction.GetString(), prediction.GetStringLength());
						}
					}
					
					std::string didYouMeanMessage = "Did you mean: \n";
					size_t messageLength = messageStart.length();
					messageLength += didYouMeanMessage.length();
					for (std::string& prediction : topPredictions) {
						messageLength += prediction.length() + 1/*\n*/;
					}
					messageLength += messageEnd.length();
					topMessage.reserve(topMessage.length() + messageLength);
					topMessage += messageStart;
					topMessage += didYouMeanMessage;
					for (std::string& prediction : topPredictions) {
						topMessage += prediction;
						topMessage += '\n';
					}
					topMessage += messageEnd;

					client.sendMessage(message.channelID, topMessage, SleepyDiscord::Async);
					return;
				}

				rapidjson::Document document;
				document.Parse(response.text.c_str(), response.text.length());
				if (document.HasParseError())
					return;

				SleepyDiscord::Embed embed{};

				auto definitelyLegal = document.FindMember("definitely-legal");
				if (definitelyLegal != document.MemberEnd() && definitelyLegal->value.IsBool())
					embed.description += definitelyLegal->value.GetBool() ? "Definitely of legal age\n" :
						"Definitely not of legal age\n";

				auto year = document.FindMember("year");
				if (year != document.MemberEnd() && year->value.IsInt())
					embed.fields.push_back(SleepyDiscord::EmbedField{ "Birth Year",
						std::to_string(year->value.GetInt()), true });

				auto appearence = document.FindMember("age-group-by-appearance");
				if (appearence != document.MemberEnd() && appearence->value.IsString())
					embed.fields.push_back(SleepyDiscord::EmbedField{ "Looks like a(n)",
						std::string{ appearence->value.GetString(), appearence->value.GetStringLength() }, true });

				auto ageInShow = document.FindMember("age-in-show");
				if (ageInShow != document.MemberEnd()) {
					const auto addAgeInStory = [&embed](std::string value) {
						embed.fields.push_back(SleepyDiscord::EmbedField{ "Age in Story",
							value, true });
					};

					if (ageInShow->value.IsInt()) {
						addAgeInStory(std::to_string(ageInShow->value.GetInt()));
					} else if (ageInShow->value.IsString()) {
						addAgeInStory(std::string{ ageInShow->value.GetString(), ageInShow->value.GetStringLength() });
					}
				}
					
				auto image = document.FindMember("image");
				if (image != document.MemberEnd() && image->value.IsString())
					embed.image.url = std::string{ image->value.GetString(), image->value.GetStringLength() };

				embed.description += "[Source](https://yourwaifu.dev/is-your-waifu-legal/?q=" + waifuName + ')';

				client.sendMessage(message.channelID, topMessage, embed,
				SleepyDiscord::TTS::Default,
				SleepyDiscord::Async);
			});
		}
	});

	Command::defaultCommand = &(Command::all.at("legal"));

	WaifuClient client(token);
	client.setTokens(tokenDoc);
	client.run();
}