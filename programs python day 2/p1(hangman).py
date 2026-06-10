word1=input("Enter the word")
listi=list(word1)
list1=["_"]*len(word1)
for i in list1:
    print(i,end=" ")
print()
i=0;
while(i<len(listi)):
    char=input("Enter Guess :-")
    print()
    for j in range(len(word1)):
        if listi[j]==char:
            list1[j]=char
    i+=1
    if("_")not in list1:
        print("You guessed the word",word1)
        print("You won")
        break;
    for l in list1:
        print(l,end=" ")