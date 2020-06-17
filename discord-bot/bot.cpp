#include "sleepy_discord/sleepy_discord.h"
#include "IO_file.h"

//bolderplate code
bool startsWith(const std::string& target, const std::string& test) {
	return target.compare(0, test.size(), test) == 0;
}

static inline void trim(std::string& s) {
	s.erase(std::find_if(s.rbegin(), s.rend(), [](int ch) {
		return !std::isspace(ch);
		}).base(), s.end());
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
			pollImplementation(client);
			pollTomarrow(client);
		}, oneDayInMilliseconds);
	}

	void start(SleepyDiscord::DiscordClient& client) {
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
				commit != commits.begin();
				commit -= 1
			) {
				auto sha = commit->FindMember("sha");
				if (sha == commit->MemberEnd() || !sha->value.IsString()) {
					continue;
				}
				auto data = commit->FindMember("commit");
				if (data == commit->MemberEnd() || !data->value.IsObject()) {
					continue;
				}
				auto message = data->value.FindMember("message");
				if (message == commit->MemberEnd() || !message->value.IsString()) {
					continue;
				}
				embed.fields.push_back(SleepyDiscord::EmbedField{
					std::string {
						sha->value.GetString(),
						sha->value.GetStringLength() <= 9 ?
							sha->value.GetStringLength(): 9
					},
					std::string {
						message->value.GetString(),
						message->value.GetStringLength()
					}
				});

				//check if we are over the embed limits
				//to do list the embed limits in the library
				if (25 <= embed.fields.size()) {
					client.sendMessage(channel, "", embed, false, SleepyDiscord::Async);
					embed = SleepyDiscord::Embed{};
				}
			}

			lastCommitSha = std::string {
				commits.begin()->GetString(),
				commits.Begin()->GetStringLength()
			};

			client.sendMessage(channel, "", embed, false, SleepyDiscord::Async);
		});
	}

	const time_t oneDayInMilliseconds = /*86400000*/60000;
	std::string lastCommitSha;
	const std::string repoCommitsLink =
		/*"https://api.github.com/repositories/54995014/commits"*/ "https://api.github.com/repositories/173533646/commits";
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
		SleepyDiscord::DiscordClient(token, SleepyDiscord::USER_CONTROLED_THREADS)
	{
		updateSearchTree();
	}

	void onReady(SleepyDiscord::Ready ready) override {
		discordAPIDocsRepoWatcher.start(*this);
	}
	
	void onServer(SleepyDiscord::Server server) override {
		serverCount += 1;
	}

	void onDeleteServer(SleepyDiscord::UnavailableServer server) override {
		serverCount -= 1;
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

	const SleepyDiscord::Embed getStatus() {
		SleepyDiscord::Embed status;
		//to do use some template tuple magic
		status.fields.emplace_back("Server Count",
			std::to_string(serverCount), true);
		return status;
	}

private:
	rapidjson::Document searchTree;
	DiscordAPIDocsRepoWatcher discordAPIDocsRepoWatcher;
	
	//server status
	int serverCount = 0;
};

int main() {
	std::string token;
	{
		File tokenFile("DiscordToken.txt");
		const std::size_t tokenSize = tokenFile.getSize();
		if (tokenSize == static_cast<std::size_t>(-1)) {
			std::cout << "Error: Can't find DiscordToken.txt\n";
			return 1;
		}
		token.resize(tokenSize);
		tokenFile.get<std::string::value_type>(&token[0]);
		trim(token);
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
			client.sendMessage(message.channelID, "", client.getStatus(), SleepyDiscord::Async);
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

					auto& childrenValue = childrenIterator->value;
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
						if (allKeys.Size() < index)
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
					const auto addAgeInStory = [&embed](std::string& value) {
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

				client.sendMessage(message.channelID, topMessage, embed, SleepyDiscord::Async);
			});
		}
	});

	Command::defaultCommand = &(Command::all.at("legal"));

	WaifuClient client(token);
	client.run();
}